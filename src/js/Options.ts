import * as moment from 'moment';

export class Options {
    timeZone = '';
    format: string;
    dayViewHeaderFormat = 'MMMM YYYY';
    extraFormats: string[] = [];
    stepping = 1;
    minDate: moment.Moment | null = null;
    maxDate: moment.Moment | null = null;
    useCurrent: 'year' | 'month' | 'day' | 'hour' | 'minute';
    collapse = true;
    locale = moment().locale();
    defaultDate: moment.Moment;
    disabledDates: moment.Moment[] = [];
    enabledDates: moment.Moment[] = [];
    icons = new Icons();
    tooltips = new Tooltips();
    useStrict = false;
    sideBySide = false;
    daysOfWeekDisabled: number[] = [];
    calendarWeeks = false;
    viewMode: 'times' | 'days' | 'months' | 'years' | 'decades';
    toolbarPlacement: 'default' | 'top' | 'bottom' = 'default';
    buttons = new Buttons();
    widgetPositioning = 'auto';
    widgetParent: '' = null;
    ignoreReadonly = false;
    keepOpen = false;
    focusOnShow = true;
    inline = false;
    keepInvalid = false;
    keyBinds = ''; //todo
    debug = false;
    allowInputToggle = false;
    disabledTimeIntervals: moment.Moment[][];
    disabledHours: number[] = [];
    enabledHours: number[] = [];
    viewDate: moment.Moment;
    allowMultidate = false;
    multidateSeparator = ',';
    parseInputDate: Function;
}

export class Icons {
    time = 'fa fa-clock-o';
    date = 'fa fa-calendar';
    up = 'fa fa-arrow-up';
    down = 'fa fa-arrow-down';
    previous = 'fa fa-chevron-left';
    next = 'fa fa-chevron-right';
    today = 'fa fa-calendar-check-o';
    clear = 'fa fa-delete';
    close = 'fa fa-times';
}

export class Tooltips {
    today = 'Go to today';
    clear = 'Clear selection';
    close = 'Close the picker';
    selectMonth = 'Select Month';
    prevMonth = 'Previous Month';
    nextMonth = 'Next Month';
    selectYear = 'Select Year';
    prevYear = 'Previous Year';
    nextYear = 'Next Year';
    selectDecade = 'Select Decade';
    prevDecade = 'Previous Decade';
    nextDecade = 'Next Decade';
    prevCentury = 'Previous Century';
    nextCentury = 'Next Century';
    pickHour = 'Pick Hour';
    incrementHour = 'Increment Hour';
    decrementHour = 'Decrement Hour';
    pickMinute = 'Pick Minute';
    incrementMinute = 'Increment Minute';
    decrementMinute = 'Decrement Minute';
    pickSecond = 'Pick Second';
    incrementSecond = 'Increment Second';
    decrementSecond = 'Decrement Second';
    togglePeriod = 'Toggle Period';
    selectTime = 'Select Time';
    selectDate = 'Select Date';
}

export class Buttons {
    showToday = false;
    showClear = false;
    showClose = false;
}