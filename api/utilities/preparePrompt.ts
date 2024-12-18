const promptTemplate = `
Створи опис та назву товару українською для Shopify на основі:
1. Назва товару: "{{title}}".
2. Опис: "{{description}}".

**Вимоги**:
- Видали фрази про консультації, гарантію, "купуйте уважно" та відхилення.
- Опис має містити HTML (h2/h3/p/ul/li):
  - Перший блок — один короткий параграф з описом товару (без заголовка).
  - Другий блок - характеристики (при відсутньості скомпонуй з наявної інформації).
  - Третій (необов'язковий) блок - Комплектація.

**Результат**: JSON з полями:
1. **html**: оформлений опис.
2. **title**: оптимальна назва з p/n.
`;

export default function preparePrompt(
  title: string,
  description: string
): string {
  return promptTemplate
    .replace('{{title}}', title)
    .replace('{{description}}', description);
}
