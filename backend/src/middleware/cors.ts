import cors from 'cors';

const corsOptions = {
  origin: [
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5171',
    'http://87.120.166.203:5173',
    'http://localhost:5171'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

export default cors(corsOptions);