import cors from 'cors';

const corsOptions = {
  origin: [
    'http://localhost:3000', // React dev server
    //'http://admin.yourdomain.com', // Production admin
    //'https://admin.yourdomain.com'
  ],
  credentials: true
};

export default cors(corsOptions);