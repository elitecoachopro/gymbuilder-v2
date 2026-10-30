/** Copy before clearing: FileList may be live, and the same file must be selectable again. */
export function consumeFileSelection<T>(input: { files: ArrayLike<T> | null; value: string }): T[] {
  const files = Array.from(input.files || []);
  input.value = '';
  return files;
}
