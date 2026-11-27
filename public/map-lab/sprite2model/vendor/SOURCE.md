# Sprite2Model browser build

The [Sprite2Model MIT-licensed source](https://github.com/Coldensjo/sprite2model/tree/b8bb34c8604fff256229429a6bf7531293f002e1) includes the Item reading for a flat inventory sprite. The checked-in module was compiled with Go 1.25.14 using `GOOS=js GOARCH=wasm go build -buildvcs=false -trimpath -ldflags="-s -w" -o sprite2model.wasm ./cmd/wasm`. The Go runtime script and its license come from the same Go distribution.

From the Marinie City repository root, run `node scripts/build-wharf-models.mjs` to prepare the Wharf sprites and regenerate the catalog and draft models with this module.
