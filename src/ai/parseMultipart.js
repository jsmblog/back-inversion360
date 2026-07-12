import Busboy from 'busboy';

export const parseMultipart = (req) =>
  new Promise((resolve, reject) => {
    const fields = {};
    const files  = [];

    const bb = Busboy({ headers: req.headers });

    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    bb.on('file', (fieldname, stream, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end',  ()    => {
        files.push({
          fieldname,
          originalname: filename,
          mimetype:     mimeType,
          buffer:       Buffer.concat(chunks),
        });
      });
    });

    bb.on('finish', () => resolve({ fields, files }));
    bb.on('error',  err => reject(err));


    if (req.rawBody) {
      bb.end(req.rawBody);
    } else {
      req.pipe(bb);
    }
  });