# @mixer/parallel-prettier

A wrapper around [prettier]() that formats files in parallel to speed up large projects.

```
npm install -g @mixer/parallel-prettier
```

After installing the CLI, the `pprettier` command will be available to you.

### Ad-hoc Performance

```
# 300 file project:

prettier --write "src/**/*.{ts,tsx,json,scss}"  6.57s user 0.55s system 131% cpu 5.405 total
pprettier --write "src/**/*.{ts,tsx,json,scss}"  0.41s user 0.08s system 14% cpu 3.455 total

# 1200 file project:

prettier --write "src/**/*.{ts,tsx,json,scss}"  27.09s user 3.26s system 123% cpu 24.496 total
pprettier --write "src/**/*.{ts,tsx,json,scss}"  1.21s user 0.27s system 14% cpu 10.580 total
```
