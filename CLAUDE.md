## Image Handling Rules

Before reading any image file:
1. Validate the file exists and is non-empty
2. Check if the current model supports image input
3. If the model does NOT support image input, skip image processing entirely — just reference the file path as text instead of attempting to read the image content
