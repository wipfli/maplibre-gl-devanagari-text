import wasmModule from './hb.wasm';
import hbjs from './hbjs.js';
import base64Font from './NotoSansDevanagari-Regular.ttf.base64.txt';
import encodingCSV from './encoding.csv';

var hb = null;
var font = null;
var encoding = {};


async function prepare() {
    const wasmInstance = await wasmModule();
    hb = hbjs(wasmInstance.instance);

    const binaryString = atob(base64Font);
    
    const fontBlob = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        fontBlob[i] = binaryString.charCodeAt(i);
    }

    var blob = hb.createBlob(fontBlob);
    var face = hb.createFace(blob, 0);
    font = hb.createFont(face);

    font.setScale(1000, 1000);

    const encodingLines = encodingCSV.split('\n');
    
    for (var line of encodingLines.slice(1)) {
        const [index, x_offset, y_offset, x_advance, y_advance, codepoint] = line.split(',');
        encoding[`${index}/${x_offset}/${y_offset}/${x_advance}/${y_advance}`] = +codepoint;
    }
    
    self.registerRTLTextPlugin({
        'applyArabicShaping': applyArabicShaping,
        'processBidirectionalText': processBidirectionalText,
        'processStyledBidirectionalText': processStyledBidirectionalText
    });
}

prepare();

function getCodepoint(positionedGlyph) {
    const index = positionedGlyph['g'];
    const x_offset  = Math.round(positionedGlyph['dx'] / 64);
    const y_offset  = Math.round(positionedGlyph['dy'] / 64);
    const x_advance = Math.round(positionedGlyph['ax'] / 64);
    const y_advance = Math.round(positionedGlyph['ay'] / 64);

    var key = '';

    key = `${index}/${x_offset}/${y_offset}/${x_advance}/${y_advance}`;
    if (encoding[key] !== undefined) {
        return encoding[key]
    }

    key = `${index}/${x_offset}/${y_offset}/${x_advance + 1}/${y_advance}`;
    if (encoding[key] !== undefined) {
        return encoding[key]
    }

    key = `${index}/${x_offset}/${y_offset}/${x_advance - 1}/${y_advance}`;
    if (encoding[key] !== undefined) {
        return encoding[key]
    }

    key = `${index}/${x_offset}/${y_offset}/${x_advance}/${y_advance}`;
    console.log(key, 'not found');

    return 65; // Capital A - means no codepoint found
}

function shape(text) {

    var buffer = hb.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer); 

    return buffer.json(font);
}

function encode(text) {
    var result = ''

    var glyphVector = shape(text);
    for (var positionedGlyph of glyphVector) {
        result += String.fromCharCode(getCodepoint(positionedGlyph));
    }

    return result;
}

function breakStringIntoDevanagariParts(input) {
    const regex = /(\p{Script=Devanagari}+|[^\p{Script=Devanagari}]+)/gu;
    return input.match(regex);
}

function isDevanagari(str) {
    const devanagariRegex = /^[\p{Script=Devanagari}]+$/u;
    return devanagariRegex.test(str);
}

function applyArabicShaping(input) {
    var result = '';
    var parts = breakStringIntoDevanagariParts(input);
    if (!parts) {
        return input;
    }
    for (var part of parts) {
        if (isDevanagari(part)) {
            result += encode(part);
        }
        else {
            result += part;
        }
    }
    return result;
}

function processBidirectionalText(input, lineBreakPoints) {
    let result = [];
    let start = 0;
    for (let i = 0; i < lineBreakPoints.length; i++) {
        let end = lineBreakPoints[i];
        result.push(input.slice(start, end));
        start = end;
    }
    result.push(input.slice(start));
    return result;
}

function processStyledBidirectionalText(text, styleIndices, lineBreakPoints) {
    console.log('Error: processStyledBidirectionalText is not implemented.');
    return null;
}
