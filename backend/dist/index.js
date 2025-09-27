import express from 'express';
const app = express();
app.get('/', (req, res) => {
    console.log('get page');
    res.send("hello world");
});
app.listen(3000);
//# sourceMappingURL=index.js.map