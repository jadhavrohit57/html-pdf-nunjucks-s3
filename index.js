const nunjucks = require('nunjucks');
const puppeteer = require('puppeteer');

const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');

const S3 = new S3Client({
	region: 'ap-south-1',
	credentials: {
		accessKeyId: '',
		secretAccessKey: ''
	}
});

const createCertificateHTML = (templatePath, data) => {
	return nunjucks.render(templatePath, data);
};

const convertHtmlToPdfOfCertificate = async (htmlDoc) => {
	const browser = await puppeteer.launch({
		headless: 'new',
		executablePath: process.env.CHROME_BIN || null,
		args: [ '--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage' ]
	});

	const page = await browser.newPage();

	await page.setContent(htmlDoc);
	const pdfBuffer = await page.pdf({
		path: 'certificate.pdf', // to save file locally
		format: 'A4'
		// landscape: true,
		// printBackground: true,
		// displayHeaderFooter: true
	});

	await browser.close();
	return pdfBuffer;
};

// upload pdf buffer to S3

const uploadToS3 = async (filename, file) => {
	return await S3.send(
		new PutObjectCommand({
			Bucket: 'pdfbuckettest',
			Key: filename,
			Body: file
		})
	);
};

// execute
(async () => {
	const certificateInfo = {
		USER_NAME: 'ROHIT JADHAV',
		COURSE_NAME: 'NODEJS BASIC TRAINING',
		PERCENTAGE: 85,
		DATE: '10 July, 2023'
	};

	const cert_html = createCertificateHTML('./template.html', certificateInfo);
	const pdfData = await convertHtmlToPdfOfCertificate(cert_html);
	const S3Res = await uploadToS3('certificate-new2.pdf', pdfData);
	console.log('S3Res == ', S3Res);
	return S3Res;
})();
