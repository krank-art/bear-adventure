import { h } from "./html";

function toCamelCase(input) {
  return input
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, chr) => chr ? chr.toUpperCase() : '')
    .replace(/^./, str => str.toLowerCase());
}

export default class PropertyList {
  constructor({element, onPropEdit = (eventType, value) => { }}) {
    this.element = element;
    this.properties = {};
    this.onPropEdit = onPropEdit;
    this.setup();
  }

  setup() {
    const rawProps = Array.from(this.element.querySelectorAll(".prop-list-row"));
    for (const rawProp of rawProps) {
      const propId = rawProp.dataset.propId;
      const editable = rawProp.dataset.editable === "true";
      const label = rawProp.querySelector("dt").textContent;
      this.properties[propId] = { label, editable };
    }
  }

  update(payload) {
    const output = [];
    for (const propName in this.properties) {
      const property = this.properties[propName];
      const { label, editable } = property;
      const value = payload[propName] ?? '';
      const labelElement = h("dt", { textContent: label });
      const valueElement = h("dd", { textContent: value });
      const classes = editable === true ? ["prop-list-row"] : ["prop-list-row", "readonly"];
      output.push(h("div",
        { classes, ["data-prop-id"]: propName },
        [labelElement, valueElement]));
      if (!editable) continue;
      valueElement.contentEditable = true;
      valueElement.addEventListener("input", (() => {
        this.onPropEdit("input", propName, valueElement.textContent.trim());
      }).bind(this));
      valueElement.addEventListener("keydown", ((event) => {
        if (event.key !== "Enter") return;
        event.preventDefault(); // prevent line break
        valueElement.blur();
      }).bind(this));
      valueElement.addEventListener("blur", (() => {
        this.onPropEdit("submit", propName, valueElement.textContent.trim());
      }).bind(this));
    }
    this.element.innerHTML = "";
    for (const child of output)
      this.element.appendChild(child);
  }
}
