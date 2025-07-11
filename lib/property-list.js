function toCamelCase(input) {
  return input
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, chr) => chr ? chr.toUpperCase() : '')
    .replace(/^./, str => str.toLowerCase());
}

export default class PropertyList {
  constructor(element) {
    this.element = element;
    this.properties = {};
    this.setup();
  }

  setup() {
    const rawProps = Array.from(this.element.querySelectorAll(".prop-list-row"));
    for (const rawProp of rawProps) {
      const propId = rawProp.dataset.propId;
      const label = rawProp.querySelector("dt").textContent;
      this.properties[propId] = { label, editable: false };
    }
  }

  update(payload) {
    const output = [];
    for (const propName in this.properties) {
      const property = this.properties[propName];
      const { label, editable } = property;
      const value = payload[propName] ?? '';
      output.push(`
        <div class="prop-list-row" data-prop-id="${propName}">
          <dt>${label}</dt>
          <dd>${value}</dd>
        </div> 
      `);
    }
    this.element.innerHTML = output.join("");
  }
}
