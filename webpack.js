var webpack = require('webpack')
webpack({
    mode: "development",
    entry: './src/app.mjs',
    output: {
        filename: './build/app.js',
        path: __dirname
    },
    target: 'node' // 这是最关键的
}, (err, stats) => {
    if (err) {
        console.log('err:', err)
    }
})
