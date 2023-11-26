const fs = require('fs');
const path = require('path');

module.exports = {
  onPreBuild: async ({ constants, utils }) => {
    const photoPath = path.join(constants.PUBLISH_DIR, '../config/photo.jpeg');
    const templatePath = path.join(constants.PUBLISH_DIR, '../config/template.vcf');
    const outputPath = path.join(constants.PUBLISH_DIR, '../netlify/functions/analytics/output.vcf');

    try {
      if (!fs.existsSync(photoPath)) {
        throw new Error(`Error: Photo file '${photoPath}' not found or inaccessible.`);
      }

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Error: Template file '${templatePath}' not found or inaccessible.`);
      }

      const photoData = fs.readFileSync(photoPath, { encoding: 'base64' });
      const templateContent = fs.readFileSync(templatePath, { encoding: 'utf-8' });

      const vcfWithImage = templateContent.replace(/{{photo}}/g, photoData);

      fs.writeFileSync(outputPath, vcfWithImage);
      console.log(`Conversion successful. Output: '${outputPath}'.`);
    } catch (error) {
      utils.build.failPlugin(error.message);
    }
  },
};
