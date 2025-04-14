import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';

const upload = multer({ dest: 'uploads/' });

const predefinedFields = {
    default: ['long_id'],
    create: ['name', 'email', 'phone'],
    attributeUpdate: []
};

const processCSV = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const results = [];
    const matchedFieldSet = [];

    const stream = fs.createReadStream(req.file.path).pipe(csvParser());

    stream
        .on('headers', (headers) => {
            headers = headers.map(h => h.trim());

            const dynamicAttribute = req.body.attribute?.toString().trim();
            console.log('Headers:', headers);
            console.log('Attribute:', dynamicAttribute);

            let matchingSet;

            if (dynamicAttribute && headers.includes('long_id') && headers.includes(dynamicAttribute)) {
                matchingSet = ['attributeUpdate', ['long_id', dynamicAttribute]];
            }

            if (!matchingSet) {
                matchingSet = Object.entries(predefinedFields).find(([_, fields]) =>
                    fields.every(field => headers.includes(field))
                );
            }

            if (!matchingSet) {
                stream.destroy();
                const dynamicMsg = dynamicAttribute
                    ? `CSV must include "long_id" and "${dynamicAttribute}" columns for attribute update.`
                    : 'Uploaded CSV does not match any predefined field structure.';
                return next(new Error(dynamicMsg));
            }

            matchedFieldSet.push(...matchingSet);
            console.log('Matched field set:', matchedFieldSet);
        })

        .on('data', (data) => {
            if (!data) return;

            const mode = matchedFieldSet[0];
            if (mode === 'default') {
                const id = data['long_id'];
                if (id) results.push(id);
            } else if (mode === 'attributeUpdate') {
                const cleanedRow = {};
                for (const key in data) {
                    const trimmedKey = key.trim();
                    cleanedRow[trimmedKey] = data[key]?.toString().trim();
                }
                results.push(cleanedRow);
            } else {
                results.push(data); // fallback
            }
        })


    .on('end', () => {
        fs.unlinkSync(req.file.path); // Clean up file
        req.parsedCSV = results;
        console.log('Parsed DATA:', results); // debug
        next();
    })

    .on('error', (err) => {
        console.error(`Stream Error: ${err.message}`);
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        next(err);
    });
};

export {
    upload,
    processCSV
};
