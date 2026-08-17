export async function readImageForm(request: Request, field: string) {
  const form = await request.formData();
  const file = form.get(field);

  if (!(file instanceof File)) {
    throw new Error(`Missing image field: ${field}`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length < 1024) throw new Error("Image is too small");
  if (buffer.length > 10 * 1024 * 1024) throw new Error("Image must be under 10MB");
  return { buffer, form };
}
