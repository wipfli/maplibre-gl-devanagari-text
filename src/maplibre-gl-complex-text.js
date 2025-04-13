import wasmModule from './hb.wasm';
import hbjs from './hbjs.js';

import base64FontDevanagari from './NotoSansDevanagari-Regular-without-glyf.ttf.base64.txt';
import encodingCSVDevanagari from './NotoSansDevanagari-Regular-v1.csv';

import base64FontKhmer from './NotoSansKhmer-Regular-without-glyf.ttf.base64.txt';
import encodingCSVKhmer from './NotoSansKhmer-Regular-v1.csv';

import base64FontMyanmar from './NotoSansMyanmar-Regular-without-glyf.ttf.base64.txt';
import encodingCSVMyanmar from './NotoSansMyanmar-Regular-v1.csv';

var hb = null;
var fonts = {};
var encodings = {};

function addFont(script, base64Font) {
    const binaryString = atob(base64Font);

    const fontBlob = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        fontBlob[i] = binaryString.charCodeAt(i);
    }

    var blob = hb.createBlob(fontBlob);
    var face = hb.createFace(blob, 0);
    fonts[script] = hb.createFont(face);
    fonts[script].setScale(1000, 1000);
}

function addEncoding(script, encodingCSV) {
    const encodingLines = encodingCSV.split('\n');
    encodings[script] = {}
    for (var line of encodingLines.slice(1)) {
        const [index, x_offset, y_offset, x_advance, y_advance, codepoint] = line.split(',');
        encodings[script][`${index}/${x_offset}/${y_offset}/${x_advance}/${y_advance}`] = +codepoint;
    }
}

async function prepare() {
    const wasmInstance = await wasmModule();
    hb = hbjs(wasmInstance.instance);

    addFont('devanagari', base64FontDevanagari);
    addEncoding('devanagari', encodingCSVDevanagari);

    addFont('khmer', base64FontKhmer);
    addEncoding('khmer', encodingCSVKhmer);

    addFont('myanmar', base64FontMyanmar);
    addEncoding('myanmar', encodingCSVMyanmar);

    self.registerRTLTextPlugin({
        'applyArabicShaping': applyArabicShaping,
        'processBidirectionalText': processBidirectionalText,
        'processStyledBidirectionalText': processStyledBidirectionalText
    });
}

prepare();

function getCodepoint(positionedGlyph, script) {
    const index = positionedGlyph['g'];
    const x_offset = Math.round(positionedGlyph['dx'] / 64);
    const y_offset = Math.round(positionedGlyph['dy'] / 64);
    const x_advance = Math.round(positionedGlyph['ax'] / 64);
    const y_advance = Math.round(positionedGlyph['ay'] / 64);

    var key = '';

    key = `${index}/${x_offset}/${y_offset}/${x_advance}/${y_advance}`;
    if (encodings[script][key] !== undefined) {
        return encodings[script][key]
    }

    key = `${index}/${x_offset}/${y_offset}/${x_advance + 1}/${y_advance}`;
    if (encodings[script][key] !== undefined) {
        return encodings[script][key]
    }

    key = `${index}/${x_offset}/${y_offset}/${x_advance - 1}/${y_advance}`;
    if (encodings[script][key] !== undefined) {
        return encodings[script][key]
    }

    key = `${index}/${x_offset}/${y_offset}/${x_advance}/${y_advance}`;
    console.log(key, 'not found');

    return 65; // Capital A - means no codepoint found
}

function shape(text, script) {

    var buffer = hb.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();
    hb.shape(fonts[script], buffer);

    return buffer.json(fonts[script]);
}

function encode(text, script) {
    var result = ''

    var glyphVector = shape(text, script);
    for (var positionedGlyph of glyphVector) {
        result += String.fromCharCode(getCodepoint(positionedGlyph, script));
    }

    return result;
}

function breakStringByScript(input) {
    const regex = /(\p{Script=Devanagari}+|\p{Script=Khmer}+|\p{Script=Myanmar}+|[^\p{Script=Devanagari}\p{Script=Khmer}\p{Script=Myanmar}]+)/gu;
    return input.match(regex);
}

function isDevanagari(str) {
    const r = /^[\p{Script=Devanagari}]+$/u;
    return r.test(str);
}

function isKhmer(str) {
    const r = /^[\p{Script=Khmer}]+$/u;
    return r.test(str);
}

function isMyanmar(str) {
    const r = /^[\p{Script=Myanmar}]+$/u;
    return r.test(str);
}

function applyArabicShaping(input) {
    var result = '';
    var parts = breakStringByScript(input);
    if (!parts) {
        return input;
    }
    for (var part of parts) {
        if (isDevanagari(part)) {
            result += encode(part, 'devanagari');
        }
        else if (isKhmer(part)) {
            result += encode(part, 'khmer');
        }
        else if (isMyanmar(part)) {
            result += encode(part, 'myanmar');
        }
        else {
            result += part;
        }
    }
    return result;
}

function processBidirectionalText(input, lineBreakPoints) {
    if (!input || input.length === 0) {
        return [input];
    }

    if (!lineBreakPoints || lineBreakPoints.length === 0) {
        return [input];
    }
    
    const lines = [];
    let startIndex = 0;
    
    for (const breakPoint of lineBreakPoints) {
        const line = input.substring(startIndex, breakPoint);
        lines.push(line);
        startIndex = breakPoint;
    }
    
    if (startIndex < input.length) {
        lines.push(input.substring(startIndex));
    }
    
    return lines;
}

function processStyledBidirectionalText(text, styleIndices, lineBreakPoints) {

    if (!text || text.length === 0) return [];
    if (styleIndices.length !== text.length) {
        throw new Error('styleIndices must have the same length as text');
    }

    const sortedBreakPoints = [...lineBreakPoints].sort((a, b) => a - b);
    if (!sortedBreakPoints.includes(text.length)) {
        sortedBreakPoints.push(text.length);
    }

    const result = [];
    let startIndex = 0;

    for (const breakPoint of sortedBreakPoints) {
        if (breakPoint <= startIndex) continue;

        const lineText = text.substring(startIndex, breakPoint);
        const lineStyles = styleIndices.slice(startIndex, breakPoint);

        let segmentStart = 0;
        let currentStyle = lineStyles[0];

        for (let i = 1; i < lineText.length; i++) {
            if (lineStyles[i] !== currentStyle) {
                const textValue = lineText.substring(segmentStart, i);
                result.push([
                    textValue,
                    Array(textValue.length).fill(currentStyle)
                ]);
                segmentStart = i;
                currentStyle = lineStyles[i];
            }
        }

        const textValue = lineText.substring(segmentStart);
        result.push([
            textValue,
            Array(textValue.length).fill(currentStyle)
        ]);

        startIndex = breakPoint;
    }

    const withoutBreaks = result.filter(entry => entry[0] !== '\n');
    return withoutBreaks;
}
