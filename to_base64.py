import base64
import subprocess

def convert_font_to_base64(font_base_name):
    with open(f"src/{font_base_name}-without-glyf.ttf", "rb") as font_file:
        font_data = font_file.read()
        base64_encoded_data = base64.b64encode(font_data)
        base64_string = base64_encoded_data.decode('utf-8')
    
    with open(f"src/{font_base_name}-without-glyf.ttf.base64.txt", 'w') as f:
        f.write(base64_string)

def remove_glyf_table(font_base_name):
    command = f'ttx src/{font_base_name}.ttf'
    print(command)
    print(subprocess.run(command, shell=True))

    command = f"sed -i '/<glyf>/,/<\/glyf>/d' src/{font_base_name}.ttx"
    print(command)
    print(subprocess.run(command, shell=True))

    command = f"ttx -o src/{font_base_name}-without-glyf.ttf src/{font_base_name}.ttx"
    print(command)
    print(subprocess.run(command, shell=True))

def cleanup(font_base_name):
    command = f'rm src/{font_base_name}.ttx src/{font_base_name}-without-glyf.ttf'
    print(command)
    print(subprocess.run(command, shell=True))



font_base_names = [
    'NotoSansDevanagari-Regular',
    'NotoSansGujarati-Regular',
    'NotoSansGurmukhi-Regular',
    'NotoSansKannada-Regular',
    'NotoSansKhmer-Regular',
    'NotoSansMyanmar-Regular',
    'NotoSansOriya-Regular',
    'NotoSansBengali-Regular',
    'NotoSansMalayalam-Regular',
    'NotoSansTelugu-Regular',
    'NotoSansTamil-Regular'
]

for font_base_name in font_base_names:
    remove_glyf_table(font_base_name)
    convert_font_to_base64(font_base_name)
    cleanup(font_base_name)
