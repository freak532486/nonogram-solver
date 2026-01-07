npx esbuild --bundle src/main.js \
    --outfile=dist/bundle.js \
    --platform=browser \
    --format=esm \
    --sourcemap \
    --loader:.html=file \
    --loader:.css=css \
    --external:/images/* \
    --external:/nonograms/joined.json