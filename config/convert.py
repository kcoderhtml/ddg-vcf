import base64

def encode_image_to_base64(image_path):
    """
    Encodes an image file to base64 format.

    Args:
        image_path (str): The path to the image file.

    Returns:
        str: The base64 encoded string representation of the image.

    """
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read())
        return encoded_string.decode("utf-8")

def insert_base64_into_vcf(template_path, base64_image):
    """
    Inserts a base64-encoded image into a vCard template file.

    Args:
        template_path (str): The path to the vCard template file.
        base64_image (str): The base64-encoded image to be inserted.

    Returns:
        None
    """
    with open(template_path, "r") as template_file:
        vcf_template = template_file.read()

    vcf_with_image = vcf_template.replace("{{photo}}", base64_image)

    with open("../dist/config/output.vcf", "w") as output_file:
        output_file.write(vcf_with_image)

if __name__ == "__main__":
    PHOTO_PATH = "photo.jpeg"
    TEMPLATE_PATH = "template.vcf"

    try:
        base64_image = encode_image_to_base64(PHOTO_PATH)
        insert_base64_into_vcf(TEMPLATE_PATH, base64_image)
        print("Conversion and insertion successful. Check 'output.vcf'.")
    except FileNotFoundError as e:
        print(f"Error: {e}. Make sure the photo and template files exist.")
    except Exception as e:
        print(f"An error occurred: {e}")

