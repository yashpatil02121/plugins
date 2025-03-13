import { KulpElement, html, css, register, prop } from "kulp-kit";

@register("basic-calender-plugin.hello-kulp")
export class HelloKulp extends KulpElement {
    @prop({ type: Number }) count = 0;

    increment() {
        this.count++;
    }

    decrement() {
        this.count--;
    }

    render() {
        return html`
        <div>
            <h1>Hello Kulp! This is a placeholder component. Start coding...</h1>
            <h2>Count: ${this.count}</h2>
            <button @click=${this.increment}>Increment</button>
            <button @click=${this.decrement}>Decrement</button>
        </div>
        `;
    }
}
