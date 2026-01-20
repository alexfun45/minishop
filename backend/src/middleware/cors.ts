import cors from 'cors';

const corsOptions = {
  origin: [
    'http://localhost:3001',
    'http://localhost:5173',
    'http://87.120.166.203:5173'
    //'http://admin.yourdomain.com', // Production admin
    //'https://admin.yourdomain.com'
  ],
  credentials: true
};

export default cors(corsOptions);