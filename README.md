# maplibre-gl-complex-text
Render complex text with Harfbuzz in MapLibre GL JS through the RTL plugin hook.

Supported scripts: 

- Bengali
- Devanagari
- Gujarati
- Gurmukhi
- Kannada
- Khmer
- Malayalam
- Myanmar
- Oriya
- Tamil
- Telugu

## Demo

https://wipfli.github.io/maplibre-gl-complex-text/

<a href="https://wipfli.github.io/maplibre-gl-complex-text/">
<img src="screenshot.png" />
</a>

### Swiss Map

Language selector available here:

https://wipfli.github.io/maplibre-gl-complex-text/swiss-map

<a href="https://wipfli.github.io/maplibre-gl-complex-text/swiss-map">
<img src="swiss-map.png" />
</a>

## Usage

You can use the MapLibre GL Complex Text plugin in the same way you use the mapbox-gl-rtl-text plugin, just need to add a special `transformRequest` at the end:

```javascript
maplibregl.setRTLTextPlugin(
    "https://wipfli.github.io/maplibre-gl-complex-text/dist/maplibre-gl-complex-text.js",
    false
);

const map = new maplibregl.Map({
    container: "map",
    style: "style.json",
    center: [96.1708, 21.9033],
    zoom: 6
});

map.setTransformRequest((url, resourceType) => {
    if (resourceType === "Glyphs") {
        const match = url.match(/(\d+)-(\d+)\.pbf$/);
        if (match) {
            const start = parseInt(match[1], 10);
            const end = parseInt(match[2], 10);
            const encodedRangeStarts = [63488, 63232, 62976, 62720, 62464, 62208, 61952, 61696, 61440, 61184, 60928, 60672, 60416, 60160, 59904, 59648, 59392, 59136, 58880, 58624, 58368, 58112, 57856, 57600, 3072, 2816, 2560, 2304, 10240, 10752];
            if (encodedRangeStarts.includes(start)) {
                return { url: `https://wipfli.github.io/pgf-glyph-ranges/font/NotoSansMultiscript-Regular-v1/${start}-${end}.pbf` };
            }
        }
    }
    return undefined;
});
```

## Build

```
npm run ci
npm run build-dev
npx serve
```

## Limitations

- You cannot use the normal RTL plugin for Arabic and Hebrew when using this plugin.
- Line breaking might be a bit wrong in MapLibre `["format"]` expressions. 

Bug reports welcome!

## License

- The code in this repo in general is licensed as MIT.
- The harfbuzzjs files are copied from https://github.com/harfbuzz/harfbuzzjs and are published under the apache license:
  - `src/hbjs.js`
  - `src/hb.wasm` 
- The font files `src/*.ttf` are published under the [Open Font License](https://en.wikipedia.org/wiki/SIL_Open_Font_License).
- The `src/*.csv` files are copied from https://github.com/wipfli/pgf-encoding and are licensed under the MIT license.
- Uses the api defined by the [Mapbox RTL Plugin](https://github.com/mapbox/mapbox-gl-rtl-text/), see [License](https://github.com/mapbox/mapbox-gl-rtl-text/blob/main/LICENSE.md).