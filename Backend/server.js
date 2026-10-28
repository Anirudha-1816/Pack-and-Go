import app from './src/app.js';

app.listen(process.env.PORT,()=>{
    console.log(`Server in Running on PORT: ${process.env.PORT}`)
})
