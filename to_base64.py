import base64

def convert_font_to_base64(font_path):
    with open(font_path, "rb") as font_file:
        font_data = font_file.read()
        base64_encoded_data = base64.b64encode(font_data)
        base64_string = base64_encoded_data.decode('utf-8')
    return base64_string

font_path = "src/NotoSansDevanagari-Regular.ttf"
base64_font = convert_font_to_base64(font_path)
print(base64_font)
