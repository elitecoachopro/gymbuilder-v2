export function translateUi<T>(value: T, locale: string, dictionary: Record<string, string>): T {
  if (typeof value !== 'string') return value;
  const categories: Record<string, string> = { strength: 'Forță', functional: 'Funcțional', accessories: 'Accesorii', lockers: 'Vestiare', reception: 'Recepție', cardio: 'Cardio', wellness: 'Wellness' };
  const key = categories[value.trim()] || value.trim();
  if (locale !== 'en') return (categories[value.trim()] || value) as T;
  const direct = dictionary[key];
  if (direct) return value.replace(value.trim(), direct) as T;
  const patterns: Array<[RegExp, (...parts: string[]) => string]> = [
    [/^Furnizorul "([\s\S]*)" a fost (aprobat|respins)\. Notificarea email (a fost acceptată pentru trimitere|nu a putut fi trimisă)\.$/, (company, decision, notification) => `Supplier "${company}" has been ${decision === 'aprobat' ? 'approved' : 'rejected'}. The email notification ${notification === 'a fost acceptată pentru trimitere' ? 'was accepted for sending' : 'could not be sent'}.`],
    [/^Pachetul permite maximum (\d+) imagini per produs\.$/, count => `Your plan allows up to ${count} images per product.`],
    [/^Mesaj contact: (.+)$/, subject => `Contact message: ${subject}`],
    [/^De la (.+) \((.+)\): (.*)$/, (name, email, message) => `From ${name} (${email}): ${message}`],
    [/^Cerere nouă de la (.+)$/, name => `New enquiry from ${name}`],
    [/^Mesaj nou de la (.+)$/, name => `New message from ${name}`],
    [/^Produs solicitat: (.+)$/, name => `Requested product: ${name}`],
    [/^Prețul a scăzut la (.+)$/, name => `Price dropped for ${name}`],
    [/^De la €(.+) la €(.+)$/, (before, after) => `From €${before} to €${after}`],
    [/^Preț invalid: (.+) \(trebuie să fie un număr pozitiv\)$/, price => `Invalid price: ${price} (must be a positive number)`],
    [/^Categorie invalidă: (.+) \(valide:.*\)$/, category => `Invalid category: ${category}. Use a supported category.`],
    [/^Stare invalidă: (.+) \(valide:.*\)$/, condition => `Invalid condition: ${condition}. Use new or used.`],
    [/^URL imagine invalid: (.+) \(trebuie să înceapă cu http\)$/, url => `Invalid image URL: ${url} (must start with http)`],
    [/^(\d+) produs\(e\) de la (\d+) furnizor\(i\)$/, (n, suppliers) => `${n} product(s) from ${suppliers} supplier(s)`],
    [/^(\d+) (produs găsit|produse găsite)$/, n => `${n} product(s) found`],
    [/^Trimite Cererea \((\d+) furnizori?\)$/, n => `Send request (${n} supplier${n === '1' ? '' : 's'})`],
    [/^(\d+) cereri salvate\. (\d+) cereri nu au fost trimise; au rămas în coș pentru reîncercare\.$/, (saved, failed) => `${saved} requests saved. ${failed} requests could not be sent and remain in the basket for retry.`],
    [/^Bună ziua! Sunt interesat\(ă\) de (.+)\.$/, name => `Hello! I am interested in ${name}.`],
    [/^Limita de (\d+) produse a fost atinsă\.(.*)$/, n => `Your ${n}-product plan limit has been reached.`],
    [/^(\d+) produse importate cu succes!(?: (\d+) rânduri cu erori au fost ignorate\.)?$/, (count, skipped) => `${count} products imported successfully!${skipped ? ` ${skipped} invalid rows were skipped.` : ''}`],
  ];
  for (const [pattern, render] of patterns) {
    const match = key.match(pattern);
    if (match) return value.replace(key, render(...match.slice(1))) as T;
  }
  return value;
}
