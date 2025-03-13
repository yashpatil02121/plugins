import { KulpElement, html, css, register, prop } from "kulp-kit";
import { ref, computed } from "vue";
import moment from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import LocalizedFormat from "dayjs/plugin/localizedFormat";

moment.extend(LocalizedFormat);
moment.extend(utc);
moment.extend(timezone);

@register("basic-calender-plugin.basic-calender")
export class BasicCalender extends KulpElement {
  @prop({ type: String }) selectedDate = "";
  @prop({ type: String }) calendarTitle = "My Calendar";
  @prop({ type: String }) eventDates = "{}";

  static styles = css`
    .calendar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px;
      font-family: sans-serif;
      width: 100%;
      height: auto;
      min-height: 200px;
      border: 1px solid #ccc;
      background-color: white;
    }
  `;

  showDatePicker = false;
  showTimePicker = false;

  get formattedDate() {
    return this.selectedDate
      ? moment(this.selectedDate).format("YYYY-MM-DD HH:mm:ss")
      : "Select Date";
  }

  openPicker() {
    this.showDatePicker = true;
    this.requestUpdate();
  }

  updateDate(value: string | number | moment.Dayjs | Date | null | undefined) {
    if (!value) return;
    this.dispatchEvent(new CustomEvent("update:selectedDate", { detail: moment(value).toISOString() }));
    this.showDatePicker = false;
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="calendar-container">
        <h3>${this.calendarTitle}</h3>
        <q-input 
          :model-value="${this.formattedDate}" 
          @click.stop="${this.openPicker}" 
          :rules="[]">
          <template v-slot:append>
            <q-btn icon="event" size="sm" round outline rounded color="primary" @click="${this.openPicker}">
              <q-dialog 
                no-parent-event 
                :model-value="${this.showDatePicker}" 
                class="z-max" 
                @hide="${() => { this.showDatePicker = false; this.requestUpdate(); }}" 
                fit transition-show="scale" transition-hide="scale">
                <q-date 
                  :model-value="${this.selectedDate || moment().format("YYYY-MM-DD")}" 
                  @update:model-value="${this.updateDate}" 
                  landscape today-btn>
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Done" color="primary" flat @click="${() => { this.showDatePicker = false; this.requestUpdate(); }}" />
                  </div>
                </q-date>
              </q-dialog>
            </q-btn>
          </template>
        </q-input>
      </div>
    `;
  }
}