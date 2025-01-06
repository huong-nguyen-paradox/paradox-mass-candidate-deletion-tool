import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';

const upload = multer({ dest: 'uploads/' });

const predefinedFields = {
    default: ['long_id'],
    create: ['name', 'email', 'phone'],
};

const processCSV = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const results = [];
    const matchedFieldSet = []

    const stream = fs.createReadStream(req.file.path).pipe(csvParser());
    stream
        .on('headers', (headers) => {

            const matchingSet = Object.entries(predefinedFields).find(([_,fields]) =>
                fields.every(field => headers.includes(field))
            );

            if (!matchingSet) {
                // Validation failed
                stream.destroy();
                return next(new Error('Uploaded CSV does not match any predefined field structure. See docs for more details.'));
            }

            matchedFieldSet.push(...matchingSet);
        })
        .on('data', (data) => {
            matchedFieldSet[0] === 'default' ? results.push(data['long_id']) : results.push(data);
        })
        .on('end', () => {
            // Clean up after ourselves
            fs.unlinkSync(req.file.path);

            req.parsedCSV = results;

            next(); // Send results back
        })
        .on('error', (err) => {
            console.error(`Stream Error: ${err.message}`);
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path); // Cleanup file
            }
            next(err); // Pass error to the error handler
        });
};


export {
    upload,
    processCSV
};
