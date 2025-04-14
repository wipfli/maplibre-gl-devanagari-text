import wasmModule from './hb.wasm';
import hbjs from './hbjs.js';

import base64FontDevanagari from './NotoSansDevanagari-Regular-without-glyf.ttf.base64.txt';
import encodingCSVDevanagari from './NotoSansDevanagari-Regular-v1.multiscript.csv';

import base64FontKhmer from './NotoSansKhmer-Regular-without-glyf.ttf.base64.txt';
import encodingCSVKhmer from './NotoSansKhmer-Regular-v1.multiscript.csv';

import base64FontMyanmar from './NotoSansMyanmar-Regular-without-glyf.ttf.base64.txt';
import encodingCSVMyanmar from './NotoSansMyanmar-Regular-v1.multiscript.csv';

import base64FontKannada from './NotoSansKannada-Regular-without-glyf.ttf.base64.txt';
import encodingCSVKannada from './NotoSansKannada-Regular-v1.multiscript.csv';

import base64FontOriya from './NotoSansOriya-Regular-without-glyf.ttf.base64.txt';
import encodingCSVOriya from './NotoSansOriya-Regular-v1.multiscript.csv';

import base64FontGujarati from './NotoSansGujarati-Regular-without-glyf.ttf.base64.txt';
import encodingCSVGujarati from './NotoSansGujarati-Regular-v1.multiscript.csv';

import base64FontGurmukhi from './NotoSansGurmukhi-Regular-without-glyf.ttf.base64.txt';
import encodingCSVGurmukhi from './NotoSansGurmukhi-Regular-v1.multiscript.csv';

import base64FontBengali from './NotoSansBengali-Regular-without-glyf.ttf.base64.txt';
import encodingCSVBengali from './NotoSansBengali-Regular-v1.multiscript.csv';

import base64FontTelugu from './NotoSansTelugu-Regular-without-glyf.ttf.base64.txt';
import encodingCSVTelugu from './NotoSansTelugu-Regular-v1.multiscript.csv';

import base64FontTamil from './NotoSansTamil-Regular-without-glyf.ttf.base64.txt';
import encodingCSVTamil from './NotoSansTamil-Regular-v1.multiscript.csv';

import base64FontMalayalam from './NotoSansMalayalam-Regular-without-glyf.ttf.base64.txt';
import encodingCSVMalayalam from './NotoSansMalayalam-Regular-v1.multiscript.csv';

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

    addFont('kannada', base64FontKannada);
    addEncoding('kannada', encodingCSVKannada);

    addFont('oriya', base64FontOriya);
    addEncoding('oriya', encodingCSVOriya);

    addFont('gujarati', base64FontGujarati);
    addEncoding('gujarati', encodingCSVGujarati);

    addFont('gurmukhi', base64FontGurmukhi);
    addEncoding('gurmukhi', encodingCSVGurmukhi);

    addFont('bengali', base64FontBengali);
    addEncoding('bengali', encodingCSVBengali);

    addFont('telugu', base64FontTelugu);
    addEncoding('telugu', encodingCSVTelugu);

    addFont('tamil', base64FontTamil);
    addEncoding('tamil', encodingCSVTamil);

    addFont('malayalam', base64FontMalayalam);
    addEncoding('malayalam', encodingCSVMalayalam);

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
    const scripts = [
        'Devanagari', 
        'Khmer',
        'Myanmar',
        'Kannada',
        'Oriya',
        'Gujarati',
        'Gurmukhi',
        'Bengali',
        'Tamil',
        'Telugu',
        'Malayalam'
    ];
    const scriptPatterns = scripts.map(script => `\\p{Script=${script}}+`);
    const negatedScripts = scripts.map(script => `\\p{Script=${script}}`).join('');
    const otherPattern = `[^${negatedScripts}]+`;
    const pattern = `(${[...scriptPatterns, otherPattern].join('|')})`;
    const regex = new RegExp(pattern, 'gu');
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

function isKannada(str) {
    const r = /^[\p{Script=Kannada}]+$/u;
    return r.test(str);
}

function isOriya(str) {
    const r = /^[\p{Script=Oriya}]+$/u;
    return r.test(str);
}

function isGujarati(str) {
    const r = /^[\p{Script=Gujarati}]+$/u;
    return r.test(str);
}

function isGurmukhi(str) {
    const r = /^[\p{Script=Gurmukhi}]+$/u;
    return r.test(str);
}

function isBengali(str) {
    const r = /^[\p{Script=Bengali}]+$/u;
    return r.test(str);
}

function isTelugu(str) {
    const r = /^[\p{Script=Telugu}]+$/u;
    return r.test(str);
}

function isTamil(str) {
    const r = /^[\p{Script=Tamil}]+$/u;
    return r.test(str);
}

function isMalayalam(str) {
    const r = /^[\p{Script=Malayalam}]+$/u;
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
        else if (isKannada(part)) {
            result += encode(part, 'kannada');
        }
        else if (isOriya(part)) {
            result += encode(part, 'oriya');
        }
        else if (isGujarati(part)) {
            result += encode(part, 'gujarati');
        }
        else if (isGurmukhi(part)) {
            result += encode(part, 'gurmukhi');
        }
        else if (isBengali(part)) {
            result += encode(part, 'bengali');
        }
        else if (isTelugu(part)) {
            result += encode(part, 'telugu');
        }
        else if (isTamil(part)) {
            result += encode(part, 'tamil');
        }
        else if (isMalayalam(part)) {
            result += encode(part, 'malayalam');
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
