import * as moment from 'moment'
import Popper from 'popper.js';
import { Options } from './Options';

export class TempusDominusCore {
    private pluginName = 'datetimepicker';
    private dataKey = `${this.pluginName}`;
    private eventKey = `.${this.dataKey}`;
    private dataApiKey = '.data-api';
    private selector = {
        DATA_TOGGLE: `[data-toggle="${this.dataKey}"]`
    };
    private className = {
        INPUT: `${this.pluginName}-input`
    };
    private event = {
        CHANGE: `change${this.eventKey}`,
        BLUR: `blur${this.eventKey}`,
        KEYUP: `keyup${this.eventKey}`,
        KEYDOWN: `keydown${this.eventKey}`,
        FOCUS: `focus${this.eventKey}`,
        CLICK_DATA_API: `click${this.eventKey}${this.dataApiKey}`,
        //emitted
        UPDATE: `update${this.eventKey}`,
        ERROR: `error${this.eventKey}`,
        HIDE: `hide${this.eventKey}`,
        SHOW: `show${this.eventKey}`
    };
    private datePickerModes = [{
        CLASS_NAME: 'days',
        NAV_FUNCTION: 'M',
        NAV_STEP: 1
    }, {
        CLASS_NAME: 'months',
        NAV_FUNCTION: 'y',
        NAV_STEP: 1
    }, {
        CLASS_NAME: 'years',
        NAV_FUNCTION: 'y',
        NAV_STEP: 10
    }, {
        CLASS_NAME: 'decades',
        NAV_FUNCTION: 'y',
        NAV_STEP: 100
    }];
    private keyMap = {
        'up': 38,
        38: 'up',
        'down': 40,
        40: 'down',
        'left': 37,
        37: 'left',
        'right': 39,
        39: 'right',
        'tab': 9,
        9: 'tab',
        'escape': 27,
        27: 'escape',
        'enter': 13,
        13: 'enter',
        'pageUp': 33,
        33: 'pageUp',
        'pageDown': 34,
        34: 'pageDown',
        'shift': 16,
        16: 'shift',
        'control': 17,
        17: 'control',
        'space': 32,
        32: 'space',
        't': 84,
        84: 't',
        'delete': 46,
        46: 'delete'
    };
    private viewModes = ['times', 'days', 'months', 'years', 'decades'];
    private keyState = {};
    private keyPressHandled = {};

    private defaults: Options;

    private currentOptions: Options;
    private htmlElement: HTMLElement;
    private dates: moment.Moment[];
    private datesFormatted: string[];
    private currentViewDate: moment.Moment;
    private input: HTMLInputElement;
    private unset: boolean;
    private component: HTMLElement | null;
    private widget: HTMLElement | null;
    private use24Hours: boolean | null;
    private actualFormat: string;
    private parseFormats: string;
    private currentViewMode: number | null;
    private minViewModeNumber: number;

    constructor(private readonly element: HTMLElement, options: Options) {
        this.currentOptions = this.getOptions(options);
        this.htmlElement = element;
        this.dates = [];
        this.datesFormatted = [];
        this.currentViewDate = null;
        this.unset = true;
        this.component = null;
        this.widget = null;
        this.use24Hours = null;
        this.actualFormat = null;
        this.parseFormats = null;
        this.currentViewMode = null;
        this.minViewModeNumber = 0;

        this.int();
    }

    private int() {
        const targetInput = this.htmlElement.getAttribute('data-target-input');
        if (this.htmlElement.tagName === 'INPUT') {
            this.input = (this.htmlElement as HTMLInputElement);
        } else if (targetInput !== undefined) {
            if (targetInput === 'nearest') {
                this.input = this.htmlElement.querySelectorAll('input')[0];
            } else {
                this.input = (document.getElementById('targetInput') as HTMLInputElement);
            }
        }

        this.dates = [];
        this.dates[0] = this.getMoment();
        this.currentViewDate = this.getMoment().clone();

        this.currentOptions = { ...this.currentOptions, ...this.dataToOptions() };

        this.options(this.currentOptions);

        this.initFormatting();

        if (this.input !== undefined && this.input.tagName === 'INPUT' && this.input.value.trim().length !== 0) {
            this.setValue(this.parseInputDate(this.input.value.trim()), 0);
        } else if (this.currentOptions.defaultDate && this.input !== undefined && this.input.getAttribute('placeholder') === undefined) {
            this.setValue(this.currentOptions.defaultDate, 0);
        }

        if (this.currentOptions.inline) {
            this.show();
        }

        if (this.element.classList.contains('input-group')) {
            const datepickerButton = this.element.querySelectorAll<HTMLElement>('.datepickerbutton');
            if (datepickerButton.length === 0) {
                this.component = this.element.querySelectorAll<HTMLElement>('[data-toggle="datetimepicker"]')[0];
            } else {
                this.component = datepickerButton[0];
            }
        }
    }

    private setAttributes(elem, obj) {
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                elem[prop] = obj[prop];
            }
        }
    }

    private empty(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
    private forEach(array, callback, scope?) {
        for (let i = 0; i < array.length; i++) {
            callback.call(scope, i, array[i]);
        }
    }

    private getDatePickerTemplate(): HTMLElement[] {
        const table = document.createElement('table'),
            headTemplate = document.createElement('thead'),
            headerTr = document.createElement('tr'),
            previousTh = document.createElement('th'),
            previousThIcon = document.createElement('i'),
            pickerSwitchTh = document.createElement('th'),
            nextTh = document.createElement('th'),
            nextThIcon = document.createElement('i'),
            bodyTemplate = document.createElement('tbody'),
            bodyTr = document.createElement('tr'),
            bodyTd = document.createElement('td'),
            daysDiv = document.createElement('div'),
            monthsDiv = document.createElement('div'),
            yearsDiv = document.createElement('div'),
            decadesDiv = document.createElement('div');

        previousTh.classList.add('prev');
        previousTh.setAttribute('data-action', 'previous');
        previousThIcon.classList.add(this.currentOptions.icons.previous);
        previousTh.insertAdjacentElement('beforeend', previousThIcon);
        headTemplate.insertAdjacentElement('beforeend', headerTr);

        pickerSwitchTh.classList.add('picker-switch');
        pickerSwitchTh.setAttribute('data-action', 'pickerSwitch');
        pickerSwitchTh.setAttribute('colspan', `${this.currentOptions.calendarWeeks ? '6' : '5'}`);
        headTemplate.insertAdjacentElement('beforeend', headerTr);

        nextTh.classList.add('next');
        nextTh.setAttribute('data-action', 'next');
        nextThIcon.classList.add(this.currentOptions.icons.next);
        nextTh.insertAdjacentElement('beforeend', nextThIcon);
        headTemplate.insertAdjacentElement('beforeend', headerTr);

        bodyTd.setAttribute('colspan', `${this.currentOptions.calendarWeeks ? '8' : '7'}`);
        bodyTemplate.insertAdjacentElement('beforeend', bodyTd);
        bodyTemplate.insertAdjacentElement('beforeend', bodyTr);

        table.classList.add('table table-sm');
        table.insertAdjacentElement('beforeend', headTemplate);
        table.insertAdjacentElement('beforeend', bodyTemplate);

        daysDiv.classList.add('datepicker-days');
        daysDiv.insertAdjacentElement('beforeend', (table.cloneNode(true)) as HTMLElement);

        monthsDiv.classList.add('datepicker-months');
        monthsDiv.insertAdjacentElement('beforeend', (table.cloneNode(true)) as HTMLElement);

        yearsDiv.classList.add('datepicker-years');
        yearsDiv.insertAdjacentElement('beforeend', (table.cloneNode(true)) as HTMLElement);

        decadesDiv.classList.add('datepicker-decades');
        decadesDiv.insertAdjacentElement('beforeend', (table.cloneNode(true)) as HTMLElement);

        return [daysDiv, monthsDiv, yearsDiv, decadesDiv];
    }

    private getTimePickerMainTemplate() {
        const topRow = document.createElement('tr'),
            middleRow = document.createElement('tr'),
            bottomRow = document.createElement('tr'),
            separator = document.createElement('td'),
            timePicker = document.createElement('div'),
            table = document.createElement('table');
        separator.classList.add('separator');
        let separatorMark = (separator.cloneNode(true)) as HTMLTableDataCellElement;
        separatorMark.textContent = ':';

        if (this.isEnabled('h')) {
            const topTd = document.createElement('td'),
                middleTd = document.createElement('td'),
                bottomTd = document.createElement('td'),
                increment = document.createElement('a'),
                iconUp = document.createElement('span'),
                innerPicker = document.createElement('span'),
                decrement = document.createElement('a'),
                iconDown = document.createElement('span');


            iconUp.classList.add(this.currentOptions.icons.up);
            this.setAttributes(increment, {
                href: '#',
                'title': this.currentOptions.tooltips.incrementHour
            });
            increment.tabIndex = -1;
            increment.dataset.action = 'incrementHours';
            increment.classList.add('btn');
            increment.insertAdjacentElement('beforeend', iconUp);
            topTd.insertAdjacentElement('beforeend', increment);
            topRow.insertAdjacentElement('beforeend', topTd);

            innerPicker.classList.add('timepicker-hour');
            innerPicker.setAttribute('title', this.currentOptions.tooltips.pickHour);
            innerPicker.dataset.timeComponent = 'hours';
            innerPicker.dataset.action = 'showHours';
            middleTd.insertAdjacentElement('beforeend', innerPicker);
            middleRow.insertAdjacentElement('beforeend', middleTd);

            iconDown.classList.add(this.currentOptions.icons.down);
            this.setAttributes(decrement, {
                href: '#',
                'title': this.currentOptions.tooltips.decrementHour
            });
            decrement.tabIndex = -1;
            decrement.dataset.action = 'decrementHour';
            decrement.classList.add('btn');
            decrement.insertAdjacentElement('beforeend', iconDown);
            bottomTd.insertAdjacentElement('beforeend', decrement);
            bottomRow.insertAdjacentElement('beforeend', bottomTd);
        }
        if (this.isEnabled('m')) {
            if (this.isEnabled('h')) {
                topRow.insertAdjacentElement('beforeend', (separator.cloneNode(true)) as HTMLElement);
                middleRow.insertAdjacentElement('beforeend', separatorMark);
                bottomRow.insertAdjacentElement('beforeend', (separator.cloneNode(true)) as HTMLElement);
            }

            const topTd = document.createElement('td'),
                middleTd = document.createElement('td'),
                bottomTd = document.createElement('td'),
                increment = document.createElement('a'),
                iconUp = document.createElement('span'),
                innerPicker = document.createElement('span'),
                decrement = document.createElement('a'),
                iconDown = document.createElement('span');


            iconUp.classList.add(this.currentOptions.icons.up);
            this.setAttributes(increment, {
                href: '#',
                'title': this.currentOptions.tooltips.incrementMinute
            });
            increment.tabIndex = -1;
            increment.dataset.action = 'incrementMinute';
            increment.classList.add('btn');
            increment.insertAdjacentElement('beforeend', iconUp);
            topTd.insertAdjacentElement('beforeend', increment);
            topRow.insertAdjacentElement('beforeend', topTd);

            innerPicker.classList.add('timepicker-minute');
            innerPicker.setAttribute('title', this.currentOptions.tooltips.pickHour);
            innerPicker.dataset.timeComponent = 'minutes';
            innerPicker.dataset.action = 'showMinutes';
            middleTd.insertAdjacentElement('beforeend', innerPicker);
            middleRow.insertAdjacentElement('beforeend', middleTd);

            iconDown.classList.add(this.currentOptions.icons.down);
            this.setAttributes(decrement, {
                href: '#',
                'title': this.currentOptions.tooltips.decrementHour
            });
            decrement.tabIndex = -1;
            decrement.dataset.action = 'decrementMinutes';
            decrement.classList.add('btn');
            decrement.insertAdjacentElement('beforeend', iconDown);
            bottomTd.insertAdjacentElement('beforeend', decrement);
            bottomRow.insertAdjacentElement('beforeend', bottomTd);
        }
        if (this.isEnabled('s')) {
            if (this.isEnabled('m')) {
                topRow.insertAdjacentElement('beforeend', (separator.cloneNode(true)) as HTMLElement);
                middleRow.insertAdjacentElement('beforeend', separatorMark);
                bottomRow.insertAdjacentElement('beforeend', (separator.cloneNode(true)) as HTMLElement);
            }

            if (this.isEnabled('h')) {
                topRow.insertAdjacentElement('beforeend', (separator.cloneNode(true)) as HTMLElement);
                middleRow.insertAdjacentElement('beforeend', separatorMark);
                bottomRow.insertAdjacentElement('beforeend', (separator.cloneNode(true)) as HTMLElement);
            }

            const topTd = document.createElement('td'),
                middleTd = document.createElement('td'),
                bottomTd = document.createElement('td'),
                increment = document.createElement('a'),
                iconUp = document.createElement('span'),
                innerPicker = document.createElement('span'),
                decrement = document.createElement('a'),
                iconDown = document.createElement('span');


            iconUp.classList.add(this.currentOptions.icons.up);
            this.setAttributes(increment, {
                href: '#',
                'title': this.currentOptions.tooltips.incrementMinute
            });
            increment.tabIndex = -1;
            increment.dataset.action = 'incrementSeconds';
            increment.classList.add('btn');
            increment.insertAdjacentElement('beforeend', iconUp);
            topTd.insertAdjacentElement('beforeend', increment);
            topRow.insertAdjacentElement('beforeend', topTd);

            innerPicker.classList.add('timepicker-second');
            innerPicker.setAttribute('title', this.currentOptions.tooltips.pickHour);
            innerPicker.dataset.timeComponent = 'seconds';
            innerPicker.dataset.action = 'showSeconds';
            middleTd.insertAdjacentElement('beforeend', innerPicker);
            middleRow.insertAdjacentElement('beforeend', middleTd);

            iconDown.classList.add(this.currentOptions.icons.down);
            this.setAttributes(decrement, {
                href: '#',
                'title': this.currentOptions.tooltips.decrementHour
            });
            decrement.tabIndex = -1;
            decrement.dataset.action = 'decrementSeconds';
            decrement.classList.add('btn');
            decrement.insertAdjacentElement('beforeend', iconDown);
            bottomTd.insertAdjacentElement('beforeend', decrement);
            bottomRow.insertAdjacentElement('beforeend', bottomTd);
        }
        if (!this.use24Hours) {
            topRow.insertAdjacentElement('beforeend', (separator.cloneNode(true)) as HTMLElement);

            const td = document.createElement('td'), btn = document.createElement('button');

            btn.classList.add('btn btn-primary');
            btn.setAttribute('title', this.currentOptions.tooltips.togglePeriod);
            btn.dataset.action = 'togglePeriod';
            btn.tabIndex = -1;

            td.insertAdjacentElement('beforeend', btn);

            middleRow.insertAdjacentElement('beforeend', td);

            bottomRow.insertAdjacentElement('beforeend', (separator.cloneNode(true)) as HTMLElement);
        }

        timePicker.classList.add('timepicker-picker');

        table.classList.add('table table-sm');
        table.insertAdjacentElement('beforeend', topRow);
        table.insertAdjacentElement('beforeend', middleRow);
        table.insertAdjacentElement('beforeend', bottomRow);

        timePicker.insertAdjacentElement('beforeend', table);

        return timePicker;
    }

    private getTimePickerTemplate() {
        const table = document.createElement('table'),
            hoursView = document.createElement('div'),
            minutesView = document.createElement('div'),
            secondsView = document.createElement('div'),
            returnView = [this.getTimePickerMainTemplate()];

        table.classList.add('table table-sm');
        hoursView.classList.add('timepicker-hours');
        hoursView.insertAdjacentElement('beforeend', (table.cloneNode(true)) as HTMLElement);

        minutesView.classList.add('timepicker-minutes');
        minutesView.insertAdjacentElement('beforeend', (table.cloneNode(true)) as HTMLElement);

        secondsView.classList.add('timepicker-seconds');
        secondsView.insertAdjacentElement('beforeend', (table.cloneNode(true)) as HTMLElement);

        if (this.isEnabled('h')) {
            returnView.push(hoursView);
        }
        if (this.isEnabled('m')) {
            returnView.push(minutesView);
        }
        if (this.isEnabled('s')) {
            returnView.push(secondsView);
        }

        return returnView;
    }

    private getToolbar() {
        const rows: HTMLTableDataCellElement[] = [],
            table = document.createElement('table'),
            tBody = document.createElement('tbody'),
            tr = document.createElement('tr');

        if (this.currentOptions.buttons.showToday) {
            const td = document.createElement('td'), a = document.createElement('a'), span = document.createElement('span');

            this.setAttributes(a, {
                href: '#',
                'title': this.currentOptions.tooltips.today
            });
            a.tabIndex = -1;
            a.dataset.action = 'today';

            span.classList.add(this.currentOptions.icons.today);
            a.insertAdjacentElement('beforeend', span);
            td.insertAdjacentElement('beforeend', a);

            rows.push(td);
        }
        if (!this.currentOptions.sideBySide && this.hasDate() && this.hasTime()) {
            let title: string, icon: string;
            if (this.currentOptions.viewMode === 'times') {
                title = this.currentOptions.tooltips.selectDate;
                icon = this.currentOptions.icons.date;
            } else {
                title = this.currentOptions.tooltips.selectTime;
                icon = this.currentOptions.icons.time;
            }

            const td = document.createElement('td'), a = document.createElement('a'), span = document.createElement('span');

            this.setAttributes(a, {
                href: '#',
                'title': title
            });
            a.tabIndex = -1;
            a.dataset.action = 'togglePicker';

            span.classList.add(icon);
            a.insertAdjacentElement('beforeend', span);
            td.insertAdjacentElement('beforeend', a);

            rows.push(td);
        }
        if (this.currentOptions.buttons.showClear) {
            const td = document.createElement('td'), a = document.createElement('a'), span = document.createElement('span');

            this.setAttributes(a, {
                href: '#',
                'title': this.currentOptions.tooltips.clear
            });
            a.tabIndex = -1;
            a.dataset.action = 'clear';

            span.classList.add(this.currentOptions.icons.clear);
            a.insertAdjacentElement('beforeend', span);
            td.insertAdjacentElement('beforeend', a);

            rows.push(td);
        }
        if (this.currentOptions.buttons.showClose) {
            const td = document.createElement('td'), a = document.createElement('a'), span = document.createElement('span');

            this.setAttributes(a, {
                href: '#',
                'title': this.currentOptions.tooltips.clear
            });
            a.tabIndex = -1;
            a.dataset.action = 'close';

            span.classList.add(this.currentOptions.icons.close);
            a.insertAdjacentElement('beforeend', span);
            td.insertAdjacentElement('beforeend', a);

            rows.push(td);
        }

        if (rows.length === 0) {
            return '';
        }

        rows.forEach(row => tr.insertAdjacentElement('beforeend', row));
        tBody.insertAdjacentElement('beforeend', tr);
        table.insertAdjacentElement('beforeend', tBody);


        rows.forEach(el => document.body.appendChild(el));

        return table;
    }

    private getTemplate() {
        const template = document.createElement('div'),
            dateView = document.createElement('div'),
            timeView = document.createElement('div'),
            content = document.createElement('ul'),
            toolbar = document.createElement('li'),
            toolbarTemplate = this.getToolbar();

        template.classList.add('bootstrap-datetimepicker-widget dropdown-menu');
        dateView.classList.add('datepicker');
        this.getDatePickerTemplate().forEach(htmlElement => dateView.insertAdjacentElement('beforeend', htmlElement));

        timeView.classList.add('timepicker');
        this.getTimePickerTemplate().forEach(htmlElement => timeView.insertAdjacentElement('beforeend', htmlElement));

        content.classList.add('list-unstyled');
        toolbar.classList.add(`picker-switch${this.currentOptions.collapse ? ' accordion-toggle' : ''}`);
        if (toolbarTemplate !== '') toolbar.insertAdjacentElement('beforeend', toolbarTemplate);

        if (this.currentOptions.inline) {
            template.classList.remove('dropdown-menu');
        }

        if (this.use24Hours) {
            template.classList.add('usetwentyfour');
        }
        if (this.isEnabled('s') && !this.use24Hours) {
            template.classList.add('wider');
        }

        if (this.currentOptions.sideBySide && this.hasDate() && this.hasTime()) {
            template.classList.add('timepicker-sbs');
            if (this.currentOptions.toolbarPlacement === 'top') {
                template.insertAdjacentElement('beforeend', toolbar);
            }
            const row = document.createElement('div');
            row.classList.add('row');
            dateView.classList.add('col-md-6');
            timeView.classList.add('col-md-6');
            row.insertAdjacentElement('beforeend', dateView);
            row.insertAdjacentElement('beforeend', timeView);


            template.insertAdjacentElement('beforeend', row);
            if (this.currentOptions.toolbarPlacement === 'bottom' || this.currentOptions.toolbarPlacement === 'default') {
                template.insertAdjacentElement('beforeend', toolbar);
            }
            return template;
        }

        if (this.currentOptions.toolbarPlacement === 'top') {
            content.insertAdjacentElement('beforeend', toolbar);
        }
        if (this.hasDate()) {
            const li = document.createElement('li');
            li.classList.add(this.currentOptions.collapse && this.hasTime() ? 'collapse' : '');
            li.classList.add((this.currentOptions.collapse && this.hasTime() && this.currentOptions.viewMode === 'times'
                ? ''
                : 'show'));
            li.insertAdjacentElement('beforeend', dateView);

            content.insertAdjacentElement('beforeend', li);
        }
        if (this.currentOptions.toolbarPlacement === 'default') {
            content.insertAdjacentElement('beforeend', toolbar);
        }
        if (this.hasTime()) {
            const li = document.createElement('li');
            li.classList.add(this.currentOptions.collapse && this.hasDate() ? 'collapse' : '');
            li.classList.add((this.currentOptions.collapse && this.hasDate() && this.currentOptions.viewMode === 'times'
                ? 'show'
                : ''));
            li.insertAdjacentElement('beforeend', timeView);

            content.insertAdjacentElement('beforeend', li);
        }
        if (this.currentOptions.toolbarPlacement === 'bottom') {
            content.insertAdjacentElement('beforeend', toolbar);
        }

        template.insertAdjacentElement('beforeend', content);
        return template;
    }

    private place(e?) {
        const self = (e && e.data && e.data.picker) || this;
        if (self.options.sideBySide) {
            self.element
                .insertAdjacentElement('beforeend', self.widget);
            return;
        }
        if (self.options.widgetParent) {
            self.options.widgetParent
                .insertAdjacentElement('beforeend', self.widget);
        } else if (self.element.is('input')) {
            self.element.after(self.widget).parent();
        } else {
            self.element.children().first().after(self.widget);
        }

        let reference = self.component[0];

        if (!reference) {
            reference = self.element;
        }

        new Popper(reference, self.widget[0], {
            placement: 'bottom-start'
        });
    }

    private fillDow() {
        const row = document.createElement('tr'),
            currentDate = this.currentViewDate.clone().startOf('w').startOf('d');

        if (this.currentOptions.calendarWeeks) {
            const th = document.createElement('th');
            th.classList.add('cw');
            th.innerText = currentDate.format('dd');

            row.insertAdjacentElement('beforeend', th);
        }

        while (currentDate.isBefore(this.currentViewDate.clone().endOf('w'))) {
            const th = document.createElement('th');
            th.classList.add('dow');
            th.innerText = '#';

            row.insertAdjacentElement('beforeend', th);
            currentDate.add(1, 'd');
        }
        this.widget.querySelectorAll('.datepicker-days thead')[0]
            .insertAdjacentElement('beforeend', row);
    }

    private fillMonths() {
        const spans: HTMLSpanElement[] = [],
            monthsShort = this.currentViewDate.clone().startOf('y').startOf('d'),
            monthTd =  this.widget.querySelectorAll('.datepicker-months td')[0];
        while (monthsShort.isSame(this.currentViewDate, 'y')) {
            const span = document.createElement('span');
            span.setAttribute('data-action', 'selectMonth');
            span.classList.add('month');
            span.innerText = monthsShort.format('MMM');

            spans.push(span);
            monthsShort.add(1, 'M');
        }

        this.empty(monthTd);
        spans.forEach(span => monthTd.insertAdjacentElement('beforeend', span));
    }

    private updateMonths() {
        const monthsView = this.widget.querySelectorAll('.datepicker-months')[0],
            monthsViewHeader = monthsView.querySelectorAll('th'),
            months = monthsView.querySelectorAll('tbody')[0].querySelectorAll('span'),
            disabled = monthsView.querySelectorAll('.disabled');

        monthsViewHeader[0].querySelectorAll('span')[0].setAttribute('title', this.currentOptions.tooltips.prevYear);
        monthsViewHeader[1].setAttribute('title', this.currentOptions.tooltips.selectYear);
        monthsViewHeader[2].querySelectorAll('span')[0].setAttribute('title', this.currentOptions.tooltips.nextYear);
        
        this.forEach(monthsView.querySelectorAll('.disabled'), (x) => {
            x.classList.remove('disabled');
        });

        for (let i = 0; i < disabled.length; ++i) {
            disabled[i].classList.remove('disabled');
        }
        
        if (!this.isValid(this.currentViewDate.clone().subtract(1, 'y'), 'y')) {
            monthsViewHeader[0].classList.add('disabled');
        }

        monthsViewHeader[1].innerText = this.currentViewDate.year() + '';

        if (!this.isValid(this.currentViewDate.clone().add(1, 'y'), 'y')) {
            monthsViewHeader[2].classList.add('disabled');
        }

        this.forEach(months, (x) => {
            x.classList.remove('active');
        });


        if (this.getLastPickedDate().isSame(this.currentViewDate, 'y') && !this.unset) {
            months[this.getLastPickedDate().month()].classList.add('active');
        }

        this.forEach(months, (index, value) => {
            if (!this.isValid(this.currentViewDate.clone().month(index), 'M')) {
                value.classList.add('disabled');
            }
        });
    }

    private getStartEndYear(factor, year) {
        const step = factor / 10,
            startYear = Math.floor(year / factor) * factor,
            endYear = startYear + step * 9,
            focusValue = Math.floor(year / step) * step;
        return [startYear, endYear, focusValue];
    }

    private updateYears() {
        const yearsView = this.widget.querySelectorAll('.datepicker-years')[0],
            yearsViewHeader = yearsView.querySelectorAll('th')[0],
            yearCaps = this.getStartEndYear(10, this.currentViewDate.year()),
            startYear = this.currentViewDate.clone().year(yearCaps[0]),
            endYear = this.currentViewDate.clone().year(yearCaps[1]);
        let html = '';

        yearsViewHeader[0].querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.prevDecade);
        yearsViewHeader[1].attr('title', this.currentOptions.tooltips.selectDecade);
        yearsViewHeader[2].querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.nextDecade);

        this.forEach(yearsView.querySelectorAll('.disabled'), (x) => {
            x.classList.remove('disabled');
        });

        if (this.currentOptions.minDate && this.currentOptions.minDate.isAfter(startYear, 'y')) {
            yearsViewHeader[0].classList.add('disabled');
        }

        yearsViewHeader[1].innerText = `${startYear.year()}-${endYear.year()}`;

        if (this.currentOptions.maxDate && this.currentOptions.maxDate.isBefore(endYear, 'y')) {
            yearsViewHeader[2].classList.add('disabled');
        }

        html += `<span data-action="selectYear" class="year old${!this.isValid(startYear, 'y') ? ' disabled' : ''}">${startYear.year() - 1}</span>`;
        while (!startYear.isAfter(endYear, 'y')) {
            html += `<span data-action="selectYear" class="year${startYear.isSame(this.getLastPickedDate(), 'y') && !this.unset ? ' active' : ''}${!this.isValid(startYear, 'y') ? ' disabled' : ''}">${startYear.year()}</span>`;
            startYear.add(1, 'y');
        }
        html += `<span data-action="selectYear" class="year old${!this.isValid(startYear, 'y') ? ' disabled' : ''}">${startYear.year()}</span>`;

        yearsView.querySelectorAll('td')[0].innerHTML =html;
    }

    private updateDecades() {
        const decadesView = this.widget.querySelectorAll('.datepicker-decades')[0],
            decadesViewHeader = decadesView.querySelectorAll('th')[0],
            yearCaps = this.getStartEndYear(100, this.currentViewDate.year()),
            startDecade = this.currentViewDate.clone().year(yearCaps[0]),
            endDecade = this.currentViewDate.clone().year(yearCaps[1]);
        let minDateDecade = false,
            maxDateDecade = false,
            endDecadeYear,
            html = '';

        decadesViewHeader[0].querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.prevCentury);
        decadesViewHeader[2].querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.nextCentury);

        decadesView.querySelectorAll('.disabled').classList.remove('disabled')[0];

        if (startDecade.year() === 0 || this.currentOptions.minDate && this.currentOptions.minDate.isAfter(startDecade, 'y')) {
            decadesViewHeader[0].classList.add('disabled');
        }

        decadesViewHeader[1].innerText = `${startDecade.year()}-${endDecade.year()}`;

        if (this.currentOptions.maxDate && this.currentOptions.maxDate.isBefore(endDecade, 'y')) {
            decadesViewHeader[2].classList.add('disabled');
        }

        if (startDecade.year() - 10 < 0) {
            html += '<span>&nbsp;</span>';
        } else {
            html += `<span data-action="selectDecade" class="decade old" data-selection="${startDecade.year() + 6}">${startDecade.year() - 10}</span>`;
        }

        while (!startDecade.isAfter(endDecade, 'y')) {
            endDecadeYear = startDecade.year() + 11;
            minDateDecade = this.currentOptions.minDate && this.currentOptions.minDate.isAfter(startDecade, 'y') && this.currentOptions.minDate.year() <= endDecadeYear;
            maxDateDecade = this.currentOptions.maxDate && this.currentOptions.maxDate.isAfter(startDecade, 'y') && this.currentOptions.maxDate.year() <= endDecadeYear;
            html += `<span data-action="selectDecade" class="decade${this.getLastPickedDate().isAfter(startDecade) && this.getLastPickedDate().year() <= endDecadeYear ? ' active' : ''}${!this.isValid(startDecade, 'y') && !minDateDecade && !maxDateDecade ? ' disabled' : ''}" data-selection="${startDecade.year() + 6}">${startDecade.year()}</span>`;
            startDecade.add(10, 'y');
        }
        html += `<span data-action="selectDecade" class="decade old" data-selection="${startDecade.year() + 6}">${startDecade.year()}</span>`;

        decadesView.querySelectorAll('td')[0].html(html);
    }

    private fillDate() {
        const daysView = this.widget.querySelectorAll('.datepicker-days')[0],
            daysViewHeader = daysView.querySelectorAll('th')[0],
            html = [];
        let currentDate: moment.Moment, row: HTMLTableRowElement, clsName: string, i: number;

        if (!this.hasDate()) {
            return;
        }

        daysViewHeader[0].querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.prevMonth);
        daysViewHeader[1].attr('title', this.currentOptions.tooltips.selectMonth);
        daysViewHeader[2].querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.nextMonth);

        this.forEach(daysView.querySelectorAll('.disabled'), (x) => {
            x.classList.remove('disabled');
        });

        daysViewHeader[1].innerText = this.currentViewDate.format(this.currentOptions.dayViewHeaderFormat);

        if (!this.isValid(this.currentViewDate.clone().subtract(1, 'M'), 'M')) {
            daysViewHeader[0].classList.add('disabled');
        }
        if (!this.isValid(this.currentViewDate.clone().add(1, 'M'), 'M')) {
            daysViewHeader[2].classList.add('disabled');
        }

        currentDate = this.currentViewDate.clone().startOf('M').startOf('w').startOf('d');

        for (i = 0; i < 42; i++) {
            //always display 42 days (should show 6 weeks)
            if (currentDate.weekday() === 0) {
                row = document.createElement('tr');
                if (this.currentOptions.calendarWeeks) {
                    row
                        .insertAdjacentElement('beforeend', `<td class="cw">${currentDate.week()}</td>`);
                }
                html.push(row);
            }
            clsName = '';
            if (currentDate.isBefore(this.currentViewDate, 'M')) {
                clsName += ' old';
            }
            if (currentDate.isAfter(this.currentViewDate, 'M')) {
                clsName += ' new';
            }
            if (this.currentOptions.allowMultidate) {
                var index = this.datesFormatted.indexOf(currentDate.format('YYYY-MM-DD'));
                if (index !== -1) {
                    if (currentDate.isSame(this.datesFormatted[index], 'd') && !this.unset) {
                        clsName += ' active';
                    }
                }
            } else {
                if (currentDate.isSame(this.getLastPickedDate(), 'd') && !this.unset) {
                    clsName += ' active';
                }
            }
            if (!this.isValid(currentDate, 'd')) {
                clsName += ' disabled';
            }
            if (currentDate.isSame(this.getMoment(), 'd')) {
                clsName += ' today';
            }
            if (currentDate.day() === 0 || currentDate.day() === 6) {
                clsName += ' weekend';
            }
            row
                .insertAdjacentElement('beforeend', `<td data-action="selectDay" data-day="${currentDate.format('L')}" class="day${clsName}">${currentDate.date()}</td>`);
            currentDate.add(1, 'd');
        }

        daysView.querySelectorAll('tbody')[0].empty()
            .insertAdjacentElement('beforeend', html);

        this.updateMonths();

        this.updateYears();

        this.updateDecades();
    }

    private fillHours() {
        const table = this.widget.querySelectorAll('.timepicker-hours table')[0],
            currentHour = this.currentViewDate.clone().startOf('d'),
            html = [];
        let row = document.createElement('tr');

        if (this.currentViewDate.hour() > 11 && !this.use24Hours) {
            currentHour.hour(12);
        }
        while (currentHour.isSame(this.currentViewDate, 'd') && (this.use24Hours || this.currentViewDate.hour() < 12 && currentHour.hour() < 12 || this.currentViewDate.hour() > 11)) {
            if (currentHour.hour() % 4 === 0) {
                row = document.createElement('tr');
                html.push(row);
            }
            row
                .insertAdjacentElement('beforeend', `<td data-action="selectHour" class="hour${!this.isValid(currentHour, 'h') ? ' disabled' : ''}">${currentHour.format(this.use24Hours ? 'HH' : 'hh')}</td>`);
            currentHour.add(1, 'h');
        }
        table.empty()
            .insertAdjacentElement('beforeend', html);
    }

    private fillMinutes() {
        const table = this.widget.querySelectorAll('.timepicker-minutes table')[0],
            currentMinute = this.currentViewDate.clone().startOf('h'),
            html = [],
            step = this.currentOptions.stepping === 1 ? 5 : this.currentOptions.stepping;
        let row = document.createElement('tr');

        while (this.currentViewDate.isSame(currentMinute, 'h')) {
            if (currentMinute.minute() % (step * 4) === 0) {
                row = document.createElement('tr');
                html.push(row);
            }
            row
                .insertAdjacentElement('beforeend', `<td data-action="selectMinute" class="minute${!this.isValid(currentMinute, 'm') ? ' disabled' : ''}">${currentMinute.format('mm')}</td>`);
            currentMinute.add(step, 'm');
        }
        table.empty()
            .insertAdjacentElement('beforeend', html);
    }

    private fillSeconds() {
        const table = this.widget.querySelectorAll('.timepicker-seconds table')[0],
            currentSecond = this.currentViewDate.clone().startOf('m'),
            html = [];
        let row = document.createElement('tr');

        while (this.currentViewDate.isSame(currentSecond, 'm')) {
            if (currentSecond.second() % 20 === 0) {
                row = document.createElement('tr');
                html.push(row);
            }
            row
                .insertAdjacentElement('beforeend', `<td data-action="selectSecond" class="second${!this.isValid(currentSecond, 's') ? ' disabled' : ''}">${currentSecond.format('ss')}</td>`);
            currentSecond.add(5, 's');
        }

        table.empty()
            .insertAdjacentElement('beforeend', html);
    }

    private fillTime() {
        let toggle: Element, newDate: Object;
        const timeComponents = this.widget.querySelectorAll('.timepicker span[data-time-component]')[0];

        if (!this.use24Hours) {
            toggle = this.widget.querySelectorAll('.timepicker [data-action=togglePeriod]')[0];
            newDate = this.getLastPickedDate().clone().add(this.getLastPickedDate().hours() >= 12 ? -12 : 12, 'h');

            toggle.innerText = this.getLastPickedDate().format('A');

            if (this.isValid(newDate, 'h')) {
                toggle.classList.remove('disabled');
            } else {
                toggle.classList.add('disabled');
            }
        }
        timeComponents.filter('[data-time-component=hours]').innerText = this.getLastPickedDate().format(`${this.use24Hours ? 'HH' : 'hh'}`);
        timeComponents.filter('[data-time-component=minutes]').innerText = this.getLastPickedDate().format('mm');
        timeComponents.filter('[data-time-component=seconds]').innerText = this.getLastPickedDate().format('ss');

        this.fillHours();
        this.fillMinutes();
        this.fillSeconds();
    }

    private doAction(e, action) {
        let lastPicked = this.getLastPickedDate();
        if ($(e.currentTarget).is('.disabled')) {
            return false;
        }
        action = action || $(e.currentTarget).data('action');
        switch (action) {
            case 'next':
                {
                    const navFnc = this.datePickerModes[this.currentViewMode].NAV_FUNCTION;
                    this.currentViewDate.add(this.datePickerModes[this.currentViewMode].NAV_STEP, navFnc);
                    this.fillDate();
                    this.viewUpdate(navFnc);
                    break;
                }
            case 'previous':
                {
                    const navFnc = this.datePickerModes[this.currentViewMode].NAV_FUNCTION;
                    this.currentViewDate.subtract(this.datePickerModes[this.currentViewMode].NAV_STEP, navFnc);
                    this.fillDate();
                    this.viewUpdate(navFnc);
                    break;
                }
            case 'pickerSwitch':
                this.showMode(1);
                break;
            case 'selectMonth':
                {
                    const month = $(e.target).closest('tbody').querySelectorAll('span')[0].index($(e.target));
                    this.currentViewDate.month(month);
                    if (this.currentViewMode === this.minViewModeNumber) {
                        this.setValue(lastPicked.clone().year(this.currentViewDate.year()).month(this.currentViewDate.month()), this.getLastPickedDateIndex());
                        if (!this.currentOptions.inline) {
                            this.hide();
                        }
                    } else {
                        this.showMode(-1);
                        this.fillDate();
                    }
                    this.viewUpdate('M');
                    break;
                }
            case 'selectYear':
                {
                    const year = parseInt($(e.target).text(), 10) || 0;
                    this.currentViewDate.year(year);
                    if (this.currentViewMode === this.minViewModeNumber) {
                        this.setValue(lastPicked.clone().year(this.currentViewDate.year()), this.getLastPickedDateIndex());
                        if (!this.currentOptions.inline) {
                            this.hide();
                        }
                    } else {
                        this.showMode(-1);
                        this.fillDate();
                    }
                    this.viewUpdate('YYYY');
                    break;
                }
            case 'selectDecade':
                {
                    const year = parseInt($(e.target).data('selection'), 10) || 0;
                    this.currentViewDate.year(year);
                    if (this.currentViewMode === this.minViewModeNumber) {
                        this.setValue(lastPicked.clone().year(this.currentViewDate.year()), this.getLastPickedDateIndex());
                        if (!this.currentOptions.inline) {
                            this.hide();
                        }
                    } else {
                        this.showMode(-1);
                        this.fillDate();
                    }
                    this.viewUpdate('YYYY');
                    break;
                }
            case 'selectDay':
                {
                    const day = this.currentViewDate.clone();
                    if ($(e.target).is('.old')) {
                        day.subtract(1, 'M');
                    }
                    if ($(e.target).is('.new')) {
                        day.add(1, 'M');
                    }

                    var selectDate = day.date(parseInt($(e.target).text(), 10)), index: number;
                    if (this.currentOptions.allowMultidate) {
                        index = this.datesFormatted.indexOf(selectDate.format('YYYY-MM-DD'));
                        if (index !== -1) {
                            this.setValue(null, index); //deselect multidate
                        } else {
                            this.setValue(selectDate, this.getLastPickedDateIndex() + 1);
                        }
                    } else {
                        this.setValue(selectDate, this.getLastPickedDateIndex());
                    }

                    if (!this.hasTime() && !this.currentOptions.keepOpen && !this.currentOptions.inline && !this.currentOptions.allowMultidate) {
                        this.hide();
                    }
                    break;
                }
            case 'incrementHours':
                {
                    const newDate = lastPicked.clone().add(1, 'h');
                    if (this.isValid(newDate, 'h')) {
                        this.setValue(newDate, this.getLastPickedDateIndex());
                    }
                    break;
                }
            case 'incrementMinutes':
                {
                    const newDate = lastPicked.clone().add(this.currentOptions.stepping, 'm');
                    if (this.isValid(newDate, 'm')) {
                        this.setValue(newDate, this.getLastPickedDateIndex());
                    }
                    break;
                }
            case 'incrementSeconds':
                {
                    const newDate = lastPicked.clone().add(1, 's');
                    if (this.isValid(newDate, 's')) {
                        this.setValue(newDate, this.getLastPickedDateIndex());
                    }
                    break;
                }
            case 'decrementHours':
                {
                    const newDate = lastPicked.clone().subtract(1, 'h');
                    if (this.isValid(newDate, 'h')) {
                        this.setValue(newDate, this.getLastPickedDateIndex());
                    }
                    break;
                }
            case 'decrementMinutes':
                {
                    const newDate = lastPicked.clone().subtract(this.currentOptions.stepping, 'm');
                    if (this.isValid(newDate, 'm')) {
                        this.setValue(newDate, this.getLastPickedDateIndex());
                    }
                    break;
                }
            case 'decrementSeconds':
                {
                    const newDate = lastPicked.clone().subtract(1, 's');
                    if (this.isValid(newDate, 's')) {
                        this.setValue(newDate, this.getLastPickedDateIndex());
                    }
                    break;
                }
            case 'togglePeriod':
                {
                    this.setValue(lastPicked.clone().add(lastPicked.hours() >= 12 ? -12 : 12, 'h'), this.getLastPickedDateIndex());
                    break;
                }
            case 'togglePicker':
                {
                    const $this = $(e.target),
                        $link = $this.closest('a'),
                        $parent = $this.closest('ul'),
                        expanded = $parent.querySelectorAll('.show')[0],
                        closed = $parent.querySelectorAll('.collapse:not(.show)')[0],
                        $span = $this.is('span') ? $this : $this.querySelectorAll('span')[0];
                    let collapseData;

                    if (expanded && expanded.length) {
                        collapseData = expanded.data('collapse');
                        if (collapseData && collapseData.transitioning) {
                            return true;
                        }
                        if (expanded.collapse) {
                            // if collapse plugin is available through bootstrap.js then use it
                            expanded.collapse('hide');
                            closed.collapse('show');
                        } else {
                            // otherwise just toggle in class on the two views
                            expanded.classList.remove('show');
                            closed.classList.add('show');
                        }
                        $span.toggleClass(this.currentOptions.icons.time + ' ' + this.currentOptions.icons.date);

                        if ($span.classList.contains(this.currentOptions.icons.date)) {
                            $link.attr('title', this.currentOptions.tooltips.selectDate);
                        } else {
                            $link.attr('title', this.currentOptions.tooltips.selectTime);
                        }
                    }
                }
                break;
            case 'showPicker':
                this.widget.querySelectorAll('.timepicker > div:not(.timepicker-picker)')[0].hide();
                this.widget.querySelectorAll('.timepicker .timepicker-picker')[0].show();
                break;
            case 'showHours':
                this.widget.querySelectorAll('.timepicker .timepicker-picker')[0].hide();
                this.widget.querySelectorAll('.timepicker .timepicker-hours')[0].show();
                break;
            case 'showMinutes':
                this.widget.querySelectorAll('.timepicker .timepicker-picker')[0].hide();
                this.widget.querySelectorAll('.timepicker .timepicker-minutes')[0].show();
                break;
            case 'showSeconds':
                this.widget.querySelectorAll('.timepicker .timepicker-picker')[0].hide();
                this.widget.querySelectorAll('.timepicker .timepicker-seconds')[0].show();
                break;
            case 'selectHour':
                {
                    let hour = parseInt($(e.target).innerText = ), 10;

                    if (!this.use24Hours) {
                        if (lastPicked.hours() >= 12) {
                            if (hour !== 12) {
                                hour += 12;
                            }
                        } else {
                            if (hour === 12) {
                                hour = 0;
                            }
                        }
                    }
                    this.setValue(lastPicked.clone().hours(hour), this.getLastPickedDateIndex());
                    if (!this.isEnabled('a') && !this.isEnabled('m') && !this.currentOptions.keepOpen && !this.currentOptions.inline) {
                        this.hide();
                    }
                    else {
                        this.doAction(e, 'showPicker');
                    }
                    break;
                }
            case 'selectMinute':
                this.setValue(lastPicked.clone().minutes(parseInt($(e.target).innerText = ), 10)), this.getLastPickedDateIndex();
                if (!this.isEnabled('a') && !this.isEnabled('s') && !this.currentOptions.keepOpen && !this.currentOptions.inline) {
                    this.hide();
                }
                else {
                    this.doAction(e, 'showPicker');
                }
                break;
            case 'selectSecond':
                this.setValue(lastPicked.clone().seconds(parseInt($(e.target).innerText = ), 10)), this.getLastPickedDateIndex();
                if (!this.isEnabled('a') && !this.currentOptions.keepOpen && !this.currentOptions.inline) {
                    this.hide();
                }
                else {
                    this.doAction(e, 'showPicker');
                }
                break;
            case 'clear':
                this.clear();
                break;
            case 'close':
                this.hide();
                break;
            case 'today':
                {
                    const todaysDate = this.getMoment();
                    if (this.isValid(todaysDate, 'd')) {
                        this.setValue(todaysDate, this.getLastPickedDateIndex());
                    }
                    break;
                }
        }
        return false;
    }

    private update() {
        if (!this.widget) {
            return;
        }
        this.fillDate();
        this.fillTime();
    }

    private setValue(targetMoment, index) {
        const oldDate = this.unset ? null : this.dates[index];
        let outpValue = '';
        // case of calling setValue(null or false)
        if (!targetMoment) {
            if (!this.currentOptions.allowMultidate || this.dates.length === 1) {
                this.unset = true;
                this.dates = [];
                this.datesFormatted = [];
            } else {
                outpValue = `${this.htmlElement.getAttribute('data-date')},`;
                outpValue = outpValue.replace(`${oldDate.format(this.actualFormat)},`, '').replace(',,', '').replace(/,\s*$/, '');
                this.dates.splice(index, 1);
                this.datesFormatted.splice(index, 1);
            }
            if (this.input !== undefined) {
                this.input.val(outpValue);
                this.input.trigger('input');
            }
            this.htmlElement.data('date', outpValue);
            this.notifyEvent({
                type: this.event.CHANGE,
                date: false,
                oldDate: oldDate
            });
            this.update();
            return;
        }

        targetMoment = targetMoment.clone().locale(this.currentOptions.locale);

        if (this.hasTimeZone()) {
            targetMoment.tz(this.currentOptions.timeZone);
        }

        if (this.currentOptions.stepping !== 1) {
            targetMoment.minutes(Math.round(targetMoment.minutes() / this.currentOptions.stepping) * this.currentOptions.stepping).seconds(0);
        }

        if (this.isValid(targetMoment)) {
            this.dates[index] = targetMoment;
            this.datesFormatted[index] = targetMoment.format('YYYY-MM-DD');
            this.currentViewDate = targetMoment.clone();
            if (this.currentOptions.allowMultidate && this.dates.length > 1) {
                for (let i = 0; i < this.dates.length; i++) {
                    outpValue += `${this.dates[i].format(this.actualFormat)}${this.currentOptions.multidateSeparator}`;
                }
                outpValue = outpValue.replace(/,\s*$/, '');
            } else {
                outpValue = this.dates[index].format(this.actualFormat);
            }
            if (this.input !== undefined) {
                this.input.val(outpValue);
                this.input.trigger('input');
            }
            this.htmlElement.data('date', outpValue);

            this.unset = false;
            this.update();
            this.notifyEvent({
                type: this.event.CHANGE,
                date: this.dates[index].clone(),
                oldDate: oldDate
            });
        } else {
            if (!this.currentOptions.keepInvalid) {
                if (this.input !== undefined) {
                    this.input.val(`${this.unset ? '' : this.dates[index].format(this.actualFormat)}`);
                    this.input.trigger('input');
                }
            } else {
                this.notifyEvent({
                    type: this.event.CHANGE,
                    date: targetMoment,
                    oldDate: oldDate
                });
            }
            this.notifyEvent({
                type: this.event.ERROR,
                date: targetMoment,
                oldDate: oldDate
            });
        }
    }

    private change(e) {
        const val = $(e.target).val().trim(),
            parsedDate = val ? this.parseInputDate(val) : null;
        this.setValue(parsedDate);
        e.stopImmediatePropagation();
        return false;
    }

    private getOptions(options: Options) {
        options = { ...this.defaults, ...options };
        return options;
    }

    private hasTimeZone() {
        return moment.tz !== undefined && this.currentOptions.timeZone !== undefined && this.currentOptions.timeZone !== null && this.currentOptions.timeZone !== '';
    }

    private isEnabled(granularity) {
        if (typeof granularity !== 'string' || granularity.length > 1) {
            throw new TypeError('isEnabled expects a single character string parameter');
        }
        switch (granularity) {
            case 'y':
                return this.actualFormat.indexOf('Y') !== -1;
            case 'M':
                return this.actualFormat.indexOf('M') !== -1;
            case 'd':
                return this.actualFormat.toLowerCase().indexOf('d') !== -1;
            case 'h':
            case 'H':
                return this.actualFormat.toLowerCase().indexOf('h') !== -1;
            case 'm':
                return this.actualFormat.indexOf('m') !== -1;
            case 's':
                return this.actualFormat.indexOf('s') !== -1;
            case 'a':
            case 'A':
                return this.actualFormat.toLowerCase().indexOf('a') !== -1;
            default:
                return false;
        }
    }

    private hasTime() {
        return this.isEnabled('h') || this.isEnabled('m') || this.isEnabled('s');
    }

    private hasDate() {
        return this.isEnabled('y') || this.isEnabled('M') || this.isEnabled('d');
    }

    private dataToOptions(): Options {
        const eData = this.htmlElement.data();
        let dataOptions = {};

        if (eData.dateOptions && eData.dateOptions instanceof Object) {
            dataOptions = $.extend(true, dataOptions, eData.dateOptions);
        }

        $.each(this.currentOptions, function (key) {
            const attributeName = `date${key.charAt(0).toUpperCase()}${key.slice(1)}`; //todo data api key
            if (eData[attributeName] !== undefined) {
                dataOptions[key] = eData[attributeName];
            } else {
                delete dataOptions[key];
            }
        });
        return dataOptions;
    }

    private notifyEvent(e) {
        if ((e.type === this.event.CHANGE && e.date && e.date.isSame(e.oldDate)) || !e.date && !e.oldDate) {
            return;
        }
        this.htmlElement.trigger(e);
    }

    private viewUpdate(e) {
        if (e === 'y') {
            e = 'YYYY';
        }
        this.notifyEvent({
            type: this.event.UPDATE,
            change: e,
            viewDate: this.currentViewDate.clone()
        });
    }

    private showMode(dir) {
        if (!this.widget) {
            return;
        }
        if (dir) {
            this.currentViewMode = Math.max(this.minViewModeNumber, Math.min(3, this.currentViewMode + dir));
        }
        this.widget.querySelectorAll('.datepicker > div')[0].hide().filter(`.datepicker-${this.datePickerModes[this.currentViewMode].CLASS_NAME}`).show();
    }

    private isInDisabledDates(testDate) {
        return this.currentOptions.disabledDates[testDate.format('YYYY-MM-DD')] === true;
    }

    private isInEnabledDates(testDate) {
        return this.currentOptions.enabledDates[testDate.format('YYYY-MM-DD')] === true;
    }

    private isInDisabledHours(testDate) {
        return this.currentOptions.disabledHours[testDate.format('H')] === true;
    }

    private isInEnabledHours(testDate) {
        return this.currentOptions.enabledHours[testDate.format('H')] === true;
    }

    private isValid(targetMoment, granularity) {
        if (!targetMoment.isValid()) {
            return false;
        }
        if (this.currentOptions.disabledDates && granularity === 'd' && this.isInDisabledDates(targetMoment)) {
            return false;
        }
        if (this.currentOptions.enabledDates && granularity === 'd' && !this.isInEnabledDates(targetMoment)) {
            return false;
        }
        if (this.currentOptions.minDate && targetMoment.isBefore(this.currentOptions.minDate, granularity)) {
            return false;
        }
        if (this.currentOptions.maxDate && targetMoment.isAfter(this.currentOptions.maxDate, granularity)) {
            return false;
        }
        if (this.currentOptions.daysOfWeekDisabled && granularity === 'd' && this.currentOptions.daysOfWeekDisabled.indexOf(targetMoment.day()) !== -1) {
            return false;
        }
        if (this.currentOptions.disabledHours && (granularity === 'h' || granularity === 'm' || granularity === 's') && this.isInDisabledHours(targetMoment)) {
            return false;
        }
        if (this.currentOptions.enabledHours && (granularity === 'h' || granularity === 'm' || granularity === 's') && !this.isInEnabledHours(targetMoment)) {
            return false;
        }
        if (this.currentOptions.disabledTimeIntervals && (granularity === 'h' || granularity === 'm' || granularity === 's')) {
            let found = false;
            $.each(this.currentOptions.disabledTimeIntervals, function () {
                if (targetMoment.isBetween(this[0], this[1])) {
                    found = true;
                    return false;
                }
            });
            if (found) {
                return false;
            }
        }
        return true;
    }

    private parseInputDate(inputDate) {
        if (this.currentOptions.parseInputDate === undefined) {
            if (!moment.isMoment(inputDate)) {
                inputDate = this.getMoment(inputDate);
            }
        } else {
            inputDate = this.currentOptions.parseInputDate(inputDate);
        }
        //inputDate.locale(this.currentOptions.locale);
        return inputDate;
    }

    private keydown(e) {
        let handler = null,
            index,
            index2: number,
            keyBindKeys,
            allModifiersPressed: boolean;
        const pressedKeys = [],
            pressedModifiers = {},
            currentKey = e.which,
            pressed = 'p';

        this.keyState[currentKey] = pressed;

        for (index in this.keyState) {
            if (this.keyState.hasOwnProperty(index) && this.keyState[index] === pressed) {
                pressedKeys.push(index);
                if (parseInt(index, 10) !== currentKey) {
                    pressedModifiers[index] = true;
                }
            }
        }

        for (index in this.currentOptions.keyBinds) {
            if (this.currentOptions.keyBinds.hasOwnProperty(index) && typeof this.currentOptions.keyBinds[index] === 'function') {
                keyBindKeys = index.split(' ');
                if (keyBindKeys.length === pressedKeys.length && this.keyMap[currentKey] === keyBindKeys[keyBindKeys.length - 1]) {
                    allModifiersPressed = true;
                    for (index2 = keyBindKeys.length - 2; index2 >= 0; index2--) {
                        if (!(this.keyMap[keyBindKeys[index2]] in pressedModifiers)) {
                            allModifiersPressed = false;
                            break;
                        }
                    }
                    if (allModifiersPressed) {
                        handler = this.currentOptions.keyBinds[index];
                        break;
                    }
                }
            }
        }

        if (handler) {
            if (handler.call(this)) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    }

    //noinspection JSMethodCanBeStatic,SpellCheckingInspection
    private keyup(e) {
        this.keyState[e.which] = 'r';
        if (this.keyPressHandled[e.which]) {
            this.keyPressHandled[e.which] = false;
            e.stopPropagation();
            e.preventDefault();
        }
    }

    private indexGivenDates(givenDatesArray) {
        // Store given enabledDates and disabledDates as keys.
        // This way we can check their existence in O(1) time instead of looping through whole array.
        // (for example: options.enabledDates['2014-02-27'] === true)
        const givenDatesIndexed = {},
            self = this;
        $.each(givenDatesArray, function () {
            const dDate = self.parseInputDate(this);
            if (dDate.isValid()) {
                givenDatesIndexed[dDate.format('YYYY-MM-DD')] = true;
            }
        });
        return Object.keys(givenDatesIndexed).length ? givenDatesIndexed : false;
    }

    private indexGivenHours(givenHoursArray) {
        // Store given enabledHours and disabledHours as keys.
        // This way we can check their existence in O(1) time instead of looping through whole array.
        // (for example: options.enabledHours['2014-02-27'] === true)
        const givenHoursIndexed = {};
        $.each(givenHoursArray, function () {
            givenHoursIndexed[this] = true;
        });
        return Object.keys(givenHoursIndexed).length ? givenHoursIndexed : false;
    }

    private initFormatting() {
        const format = this.currentOptions.format || 'L LT';

        this.actualFormat = format.replace(/(\[[^\[]*])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g, formatInput => this.dates[0].localeData().longDateFormat(formatInput) || formatInput);

        this.parseFormats = this.currentOptions.extraFormats ? this.currentOptions.extraFormats.slice() : [];
        if (this.parseFormats.indexOf(format) < 0 && this.parseFormats.indexOf(this.actualFormat) < 0) {
            this.parseFormats.push(this.actualFormat);
        }

        this.use24Hours = this.actualFormat.toLowerCase().indexOf('a') < 1 && this.actualFormat.replace(/\[.*?]/g, '').indexOf('h') < 1;

        if (this.isEnabled('y')) {
            this.minViewModeNumber = 2;
        }
        if (this.isEnabled('M')) {
            this.minViewModeNumber = 1;
        }
        if (this.isEnabled('d')) {
            this.minViewModeNumber = 0;
        }

        this.currentViewMode = Math.max(this.minViewModeNumber, this.currentViewMode);

        if (!this.unset) {
            this.setValue(this.dates[0], 0);
        }
    }

    private getLastPickedDate() {
        return this.dates[this.getLastPickedDateIndex()];
    }

    private getLastPickedDateIndex() {
        return this.dates.length - 1;
    }

    //public
    hide() {
        let transitioning = false;
        if (!this.widget) {
            return;
        }
        // Ignore event if in the middle of a picker transition
        this.widget.querySelectorAll('.collapse')[0].each(function () {
            const collapseData = $(this).data('collapse');
            if (collapseData && collapseData.transitioning) {
                transitioning = true;
                return false;
            }
            return true;
        });
        if (transitioning) {
            return;
        }
        if (this.component && this.component.classList.contains('btn')) {
            this.component.toggleClass('active');
        }
        this.widget.hide();

        $(window).off('resize', this.place());
        this.widget.off('click', '[data-action]');
        this.widget.off('mousedown', false);

        this.widget.remove();
        this.widget = null;

        this.notifyEvent({
            type: this.event.HIDE,
            date: this.getLastPickedDate().clone()
        });

        if (this.input !== undefined) {
            this.input.blur();
        }

        this.currentViewDate = this.getLastPickedDate().clone();
    }

    show() {
        let currentMoment: Object;
        const useCurrentGranularity = {
            'year': function (m) {
                return m.month(0).date(1).hours(0).seconds(0).minutes(0);
            },
            'month': function (m) {
                return m.date(1).hours(0).seconds(0).minutes(0);
            },
            'day': function (m) {
                return m.hours(0).seconds(0).minutes(0);
            },
            'hour': function (m) {
                return m.seconds(0).minutes(0);
            },
            'minute': function (m) {
                return m.seconds(0);
            }
        };

        if (this.input !== undefined) {
            if (this.input.prop('disabled') || !this.currentOptions.ignoreReadonly && this.input.prop('readonly') || this.widget) {
                return;
            }
            if (this.input.val() !== undefined && this.input.val().trim().length !== 0) {
                this.setValue(this.parseInputDate(this.input.val().trim()), 0);
            } else if (this.unset && this.currentOptions.useCurrent) {
                currentMoment = this.getMoment();
                if (typeof this.currentOptions.useCurrent === 'string') {
                    currentMoment = useCurrentGranularity[this.currentOptions.useCurrent](currentMoment);
                }
                this.setValue(currentMoment, 0);
            }
        } else if (this.unset && this.currentOptions.useCurrent) {
            currentMoment = this.getMoment();
            if (typeof this.currentOptions.useCurrent === 'string') {
                currentMoment = useCurrentGranularity[this.currentOptions.useCurrent](currentMoment);
            }
            this.setValue(currentMoment, 0);
        }

        this.widget = this.getTemplate();

        this.fillDow();
        this.fillMonths();

        this.widget.querySelectorAll('.timepicker-hours')[0].hide();
        this.widget.querySelectorAll('.timepicker-minutes')[0].hide();
        this.widget.querySelectorAll('.timepicker-seconds')[0].hide();

        this.update();
        this.showMode();

        $(window).on('resize', { picker: this }, this.place);
        this.widget.on('click', '[data-action]', $.proxy(this.doAction, this)); // this handles clicks on the widget
        this.widget.on('mousedown', false);

        if (this.component && this.component.classList.contains('btn')) {
            this.component.toggleClass('active');
        }
        this.place();
        this.widget.show();
        if (this.input !== undefined && this.currentOptions.focusOnShow && !this.input.is(':focus')) {
            this.input.focus();
        }

        this.notifyEvent({
            type: this.event.SHOW
        });
    }

    destroy() {
        this.hide();
        //todo doc off?
        this.element.removeData(TempusDominusCore.DATA_KEY);
        this.element.removeData('date');
    }

    disable() {
        this.hide();
        if (this.component && this.component.classList.contains('btn')) {
            this.component.classList.add('disabled');
        }
        if (this.input !== undefined) {
            this.input.prop('disabled', true); //todo disable this/comp if input is null
        }
    }

    enable() {
        if (this.component && this.component.classList.contains('btn')) {
            this.component.classList.remove('disabled');
        }
        if (this.input !== undefined) {
            this.input.prop('disabled', false); //todo enable comp/this if input is null
        }
    }

    toolbarPlacement(toolbarPlacement) {
        if (arguments.length === 0) {
            return this.currentOptions.toolbarPlacement;
        }

        if (typeof toolbarPlacement !== 'string') {
            throw new TypeError('toolbarPlacement() expects a string parameter');
        }
        if (toolbarPlacements.indexOf(toolbarPlacement) === -1) {
            throw new TypeError(`toolbarPlacement() parameter must be one of (${toolbarPlacements.join(', ')}) value`);
        }
        this.currentOptions.toolbarPlacement = toolbarPlacement;

        if (this.widget) {
            this.hide();
            this.show();
        }
    }

    widgetPositioning(widgetPositioning) {
        if (arguments.length === 0) {
            return this.currentOptions.widgetPositioning;
        }

        if (typeof widgetPositioning !== 'string') {
            throw new TypeError('widgetPositioning() expects a string parameter');
        }

        this.currentOptions.widgetPositioning = widgetPositioning;

        this.update();
    }

    widgetParent(widgetParent) {
        if (arguments.length === 0) {
            return this.currentOptions.widgetParent;
        }

        if (typeof widgetParent === 'string') {
            widgetParent = $(widgetParent);
        }

        if (widgetParent !== null && typeof widgetParent !== 'string' && !(widgetParent instanceof $)) {
            throw new TypeError('widgetParent() expects a string or a jQuery object parameter');
        }

        this.currentOptions.widgetParent = widgetParent;
        if (this.widget) {
            this.hide();
            this.show();
        }
    }

    getMoment(d?) {
        let returnMoment: moment.Moment;

        if (d === undefined || d === null) {
            returnMoment = moment(); //TODO should this use format? and locale?
        } else if (this.hasTimeZone()) {
            // There is a string to parse and a default time zone
            // parse with the tz function which takes a default time zone if it is not in the format string
            returnMoment = moment.tz(d, this.parseFormats, this.currentOptions.locale, this.currentOptions.useStrict, this.currentOptions.timeZone);
        } else {
            returnMoment = moment(d, this.parseFormats, this.currentOptions.locale, this.currentOptions.useStrict);
        }

        if (this.hasTimeZone()) {
            returnMoment.tz(this.currentOptions.timeZone);
        }

        return returnMoment;
    }

    toggle() {
        return this.widget ? this.hide() : this.show();
    }

    ignoreReadonly(ignoreReadonly) {
        if (arguments.length === 0) {
            return this.currentOptions.ignoreReadonly;
        }
        if (typeof ignoreReadonly !== 'boolean') {
            throw new TypeError('ignoreReadonly () expects a boolean parameter');
        }
        this.currentOptions.ignoreReadonly = ignoreReadonly;
    }

    options(newOptions) {
        if (arguments.length === 0) {
            return $.extend(true, {}, this.currentOptions);
        }

        if (!(newOptions instanceof Object)) {
            throw new TypeError('options() this.options parameter should be an object');
        }
        $.extend(true, this.currentOptions, newOptions);
        const self = this;
        $.each(this.currentOptions, function (key, value) {
            if (self[key] !== undefined) {
                self[key](value);
            }
        });
    }

    date(newDate, index) {
        index = index || 0;
        if (arguments.length === 0) {
            if (this.unset) {
                return null;
            }
            if (this.currentOptions.allowMultidate) {
                return this.dates.join(this.currentOptions.multidateSeparator);
            }
            else {
                return this.dates[index].clone();
            }
        }

        if (newDate !== null && typeof newDate !== 'string' && !moment.isMoment(newDate) && !(newDate instanceof Date)) {
            throw new TypeError('date() parameter must be one of [null, string, moment or Date]');
        }

        this.setValue(newDate === null ? null : this.parseInputDate(newDate), index);
    }

    format(newFormat) {
        if (arguments.length === 0) {
            return this.currentOptions.format;
        }

        if (typeof newFormat !== 'string' && (typeof newFormat !== 'boolean' || newFormat !== false)) {
            throw new TypeError(`format() expects a string or boolean:false parameter ${newFormat}`);
        }

        this.currentOptions.format = newFormat;
        if (this.actualFormat) {
            this.initFormatting(); // reinitialize formatting
        }
    }

    timeZone(newZone) {
        if (arguments.length === 0) {
            return this.currentOptions.timeZone;
        }

        if (typeof newZone !== 'string') {
            throw new TypeError('newZone() expects a string parameter');
        }

        this.currentOptions.timeZone = newZone;
    }

    dayViewHeaderFormat(newFormat) {
        if (arguments.length === 0) {
            return this.currentOptions.dayViewHeaderFormat;
        }

        if (typeof newFormat !== 'string') {
            throw new TypeError('dayViewHeaderFormat() expects a string parameter');
        }

        this.currentOptions.dayViewHeaderFormat = newFormat;
    }

    extraFormats(formats) {
        if (arguments.length === 0) {
            return this.currentOptions.extraFormats;
        }

        if (formats !== false && !(formats instanceof Array)) {
            throw new TypeError('extraFormats() expects an array or false parameter');
        }

        this.currentOptions.extraFormats = formats;
        if (this.parseFormats) {
            this.initFormatting(); // reinit formatting
        }
    }

    disabledDates(dates) {
        if (arguments.length === 0) {
            return this.currentOptions.disabledDates ? $.extend({}, this.currentOptions.disabledDates) : this.currentOptions.disabledDates;
        }

        if (!dates) {
            this.currentOptions.disabledDates = false;
            this.update();
            return true;
        }
        if (!(dates instanceof Array)) {
            throw new TypeError('disabledDates() expects an array parameter');
        }
        this.currentOptions.disabledDates = this.indexGivenDates(dates);
        this.currentOptions.enabledDates = false;
        this.update();
    }

    enabledDates(dates) {
        if (arguments.length === 0) {
            return this.currentOptions.enabledDates ? $.extend({}, this.currentOptions.enabledDates) : this.currentOptions.enabledDates;
        }

        if (!dates) {
            this.currentOptions.enabledDates = false;
            this.update();
            return true;
        }
        if (!(dates instanceof Array)) {
            throw new TypeError('enabledDates() expects an array parameter');
        }
        this.currentOptions.enabledDates = this.indexGivenDates(dates);
        this.currentOptions.disabledDates = false;
        this.update();
    }

    daysOfWeekDisabled(daysOfWeekDisabled) {
        if (arguments.length === 0) {
            return this.currentOptions.daysOfWeekDisabled.splice(0);
        }

        if (typeof daysOfWeekDisabled === 'boolean' && !daysOfWeekDisabled) {
            this.currentOptions.daysOfWeekDisabled = false;
            this.update();
            return true;
        }

        if (!(daysOfWeekDisabled instanceof Array)) {
            throw new TypeError('daysOfWeekDisabled() expects an array parameter');
        }
        this.currentOptions.daysOfWeekDisabled = daysOfWeekDisabled.reduce(function (previousValue, currentValue) {
            currentValue = parseInt(currentValue, 10);
            if (currentValue > 6 || currentValue < 0 || isNaN(currentValue)) {
                return previousValue;
            }
            if (previousValue.indexOf(currentValue) === -1) {
                previousValue.push(currentValue);
            }
            return previousValue;
        }, []).sort();
        if (this.currentOptions.useCurrent && !this.currentOptions.keepInvalid) {
            for (let i = 0; i < this.dates.length; i++) {
                let tries = 0;
                while (!this.isValid(this.dates[i], 'd')) {
                    this.dates[i].add(1, 'd');
                    if (tries === 31) {
                        throw 'Tried 31 times to find a valid date';
                    }
                    tries++;
                }
                this.setValue(this.dates[i], i);
            }
        }
        this.update();
    }

    maxDate(maxDate) {
        if (arguments.length === 0) {
            return this.currentOptions.maxDate ? this.currentOptions.maxDate.clone() : this.currentOptions.maxDate;
        }

        if (typeof maxDate === 'boolean' && maxDate === false) {
            this.currentOptions.maxDate = false;
            this.update();
            return true;
        }

        if (typeof maxDate === 'string') {
            if (maxDate === 'now' || maxDate === 'moment') {
                maxDate = this.getMoment();
            }
        }

        const parsedDate = this.parseInputDate(maxDate);

        if (!parsedDate.isValid()) {
            throw new TypeError(`maxDate() Could not parse date parameter: ${maxDate}`);
        }
        if (this.currentOptions.minDate && parsedDate.isBefore(this.currentOptions.minDate)) {
            throw new TypeError(`maxDate() date parameter is before options.minDate: ${parsedDate.format(this.actualFormat)}`);
        }
        this.currentOptions.maxDate = parsedDate;
        for (let i = 0; i < this.dates.length; i++) {
            if (this.currentOptions.useCurrent && !this.currentOptions.keepInvalid && this.dates[i].isAfter(maxDate)) {
                this.setValue(this.currentOptions.maxDate, i);
            }
        }
        if (this.currentViewDate.isAfter(parsedDate)) {
            this.currentViewDate = parsedDate.clone().subtract(this.currentOptions.stepping, 'm');
        }
        this.update();
    }

    minDate(minDate) {
        if (arguments.length === 0) {
            return this.currentOptions.minDate ? this.currentOptions.minDate.clone() : this.currentOptions.minDate;
        }

        if (typeof minDate === 'boolean' && minDate === false) {
            this.currentOptions.minDate = false;
            this.update();
            return true;
        }

        if (typeof minDate === 'string') {
            if (minDate === 'now' || minDate === 'moment') {
                minDate = this.getMoment();
            }
        }

        const parsedDate = this.parseInputDate(minDate);

        if (!parsedDate.isValid()) {
            throw new TypeError(`minDate() Could not parse date parameter: ${minDate}`);
        }
        if (this.currentOptions.maxDate && parsedDate.isAfter(this.currentOptions.maxDate)) {
            throw new TypeError(`minDate() date parameter is after options.maxDate: ${parsedDate.format(this.actualFormat)}`);
        }
        this.currentOptions.minDate = parsedDate;
        for (let i = 0; i < this.dates.length; i++) {
            if (this.currentOptions.useCurrent && !this.currentOptions.keepInvalid && this.dates[i].isBefore(minDate)) {
                this.setValue(this.currentOptions.minDate, i);
            }
        }
        if (this.currentViewDate.isBefore(parsedDate)) {
            this.currentViewDate = parsedDate.clone().add(this.currentOptions.stepping, 'm');
        }
        this.update();
    }

    defaultDate(defaultDate) {
        if (arguments.length === 0) {
            return this.currentOptions.defaultDate ? this.currentOptions.defaultDate.clone() : this.currentOptions.defaultDate;
        }
        if (!defaultDate) {
            this.currentOptions.defaultDate = false;
            return true;
        }

        if (typeof defaultDate === 'string') {
            if (defaultDate === 'now' || defaultDate === 'moment') {
                defaultDate = this.getMoment();
            } else {
                defaultDate = this.getMoment(defaultDate);
            }
        }

        const parsedDate = this.parseInputDate(defaultDate);
        if (!parsedDate.isValid()) {
            throw new TypeError(`defaultDate() Could not parse date parameter: ${defaultDate}`);
        }
        if (!this.isValid(parsedDate)) {
            throw new TypeError('defaultDate() date passed is invalid according to component setup validations');
        }

        this.currentOptions.defaultDate = parsedDate;

        if (this.currentOptions.defaultDate && this.currentOptions.inline || this.input !== undefined && this.input.value.trim() === '') {
            this.setValue(this.currentOptions.defaultDate, 0);
        }
    }

    locale(locale) {
        if (arguments.length === 0) {
            return this.currentOptions.locale;
        }

        if (!moment.localeData(locale)) {
            throw new TypeError(`locale() locale ${locale} is not loaded from moment locales!`);
        }

        this.currentOptions.locale = locale;

        for (let i = 0; i < this.dates.length; i++) {
            this.dates[i].locale(this.currentOptions.locale);
        }
        this.currentViewDate.locale(this.currentOptions.locale);

        if (this.actualFormat) {
            this.initFormatting(); // reinitialize formatting
        }
        if (this.widget) {
            this.hide();
            this.show();
        }
    }

    stepping(stepping) {
        if (arguments.length === 0) {
            return this.currentOptions.stepping;
        }

        stepping = parseInt(stepping, 10);
        if (isNaN(stepping) || stepping < 1) {
            stepping = 1;
        }
        this.currentOptions.stepping = stepping;
    }

    useCurrent(useCurrent) {
        const useCurrentOptions = ['year', 'month', 'day', 'hour', 'minute'];
        if (arguments.length === 0) {
            return this.currentOptions.useCurrent;
        }

        if (typeof useCurrent !== 'boolean' && typeof useCurrent !== 'string') {
            throw new TypeError('useCurrent() expects a boolean or string parameter');
        }
        if (typeof useCurrent === 'string' && useCurrentOptions.indexOf(useCurrent.toLowerCase()) === -1) {
            throw new TypeError(`useCurrent() expects a string parameter of ${useCurrentOptions.join(', ')}`);
        }
        this.currentOptions.useCurrent = useCurrent;
    }

    collapse(collapse) {
        if (arguments.length === 0) {
            return this.currentOptions.collapse;
        }

        if (typeof collapse !== 'boolean') {
            throw new TypeError('collapse() expects a boolean parameter');
        }
        if (this.currentOptions.collapse === collapse) {
            return true;
        }
        this.currentOptions.collapse = collapse;
        if (this.widget) {
            this.hide();
            this.show();
        }
    }

    icons(icons) {
        if (arguments.length === 0) {
            return $.extend({}, this.currentOptions.icons);
        }

        if (!(icons instanceof Object)) {
            throw new TypeError('icons() expects parameter to be an Object');
        }

        $.extend(this.currentOptions.icons, icons);

        if (this.widget) {
            this.hide();
            this.show();
        }
    }

    tooltips(tooltips) {
        if (arguments.length === 0) {
            return $.extend({}, this.currentOptions.tooltips);
        }

        if (!(tooltips instanceof Object)) {
            throw new TypeError('tooltips() expects parameter to be an Object');
        }
        $.extend(this.currentOptions.tooltips, tooltips);
        if (this.widget) {
            this.hide();
            this.show();
        }
    }

    useStrict(useStrict) {
        if (arguments.length === 0) {
            return this.currentOptions.useStrict;
        }

        if (typeof useStrict !== 'boolean') {
            throw new TypeError('useStrict() expects a boolean parameter');
        }
        this.currentOptions.useStrict = useStrict;
    }

    sideBySide(sideBySide) {
        if (arguments.length === 0) {
            return this.currentOptions.sideBySide;
        }

        if (typeof sideBySide !== 'boolean') {
            throw new TypeError('sideBySide() expects a boolean parameter');
        }
        this.currentOptions.sideBySide = sideBySide;
        if (this.widget) {
            this.hide();
            this.show();
        }
    }

    viewMode(viewMode) {
        if (arguments.length === 0) {
            return this.currentOptions.viewMode;
        }

        if (typeof viewMode !== 'string') {
            throw new TypeError('viewMode() expects a string parameter');
        }

        if (TempusDominusCore.ViewModes.indexOf(viewMode) === -1) {
            throw new TypeError(`viewMode() parameter must be one of (${TempusDominusCore.ViewModes.join(', ')}) value`);
        }

        this.currentOptions.viewMode = viewMode;
        this.currentViewMode = Math.max(TempusDominusCore.ViewModes.indexOf(viewMode) - 1, this.minViewModeNumber);

        this.showMode();
    }

    calendarWeeks(calendarWeeks) {
        if (arguments.length === 0) {
            return this.currentOptions.calendarWeeks;
        }

        if (typeof calendarWeeks !== 'boolean') {
            throw new TypeError('calendarWeeks() expects parameter to be a boolean value');
        }

        this.currentOptions.calendarWeeks = calendarWeeks;
        this.update();
    }

    buttons(buttons) {
        if (arguments.length === 0) {
            return $.extend({}, this.currentOptions.buttons);
        }

        if (!(buttons instanceof Object)) {
            throw new TypeError('buttons() expects parameter to be an Object');
        }

        $.extend(this.currentOptions.buttons, buttons);

        if (typeof this.currentOptions.buttons.showToday !== 'boolean') {
            throw new TypeError('buttons.showToday expects a boolean parameter');
        }
        if (typeof this.currentOptions.buttons.showClear !== 'boolean') {
            throw new TypeError('buttons.showClear expects a boolean parameter');
        }
        if (typeof this.currentOptions.buttons.showClose !== 'boolean') {
            throw new TypeError('buttons.showClose expects a boolean parameter');
        }

        if (this.widget) {
            this.hide();
            this.show();
        }
    }

    keepOpen(keepOpen) {
        if (arguments.length === 0) {
            return this.currentOptions.keepOpen;
        }

        if (typeof keepOpen !== 'boolean') {
            throw new TypeError('keepOpen() expects a boolean parameter');
        }

        this.currentOptions.keepOpen = keepOpen;
    }

    focusOnShow(focusOnShow) {
        if (arguments.length === 0) {
            return this.currentOptions.focusOnShow;
        }

        if (typeof focusOnShow !== 'boolean') {
            throw new TypeError('focusOnShow() expects a boolean parameter');
        }

        this.currentOptions.focusOnShow = focusOnShow;
    }

    inline(inline) {
        if (arguments.length === 0) {
            return this.currentOptions.inline;
        }

        if (typeof inline !== 'boolean') {
            throw new TypeError('inline() expects a boolean parameter');
        }

        this.currentOptions.inline = inline;
    }

    clear() {
        this.setValue(null); //todo
    }

    keyBinds(keyBinds) {
        if (arguments.length === 0) {
            return this.currentOptions.keyBinds;
        }

        this.currentOptions.keyBinds = keyBinds;
    }

    debug(debug) {
        if (typeof debug !== 'boolean') {
            throw new TypeError('debug() expects a boolean parameter');
        }

        this.currentOptions.debug = debug;
    }

    allowInputToggle(allowInputToggle) {
        if (arguments.length === 0) {
            return this.currentOptions.allowInputToggle;
        }

        if (typeof allowInputToggle !== 'boolean') {
            throw new TypeError('allowInputToggle() expects a boolean parameter');
        }

        this.currentOptions.allowInputToggle = allowInputToggle;
    }

    keepInvalid(keepInvalid) {
        if (arguments.length === 0) {
            return this.currentOptions.keepInvalid;
        }

        if (typeof keepInvalid !== 'boolean') {
            throw new TypeError('keepInvalid() expects a boolean parameter');
        }
        this.currentOptions.keepInvalid = keepInvalid;
    }

    datepickerInput(datepickerInput) {
        if (arguments.length === 0) {
            return this.currentOptions.datepickerInput;
        }

        if (typeof datepickerInput !== 'string') {
            throw new TypeError('datepickerInput() expects a string parameter');
        }

        this.currentOptions.datepickerInput = datepickerInput;
    }

    parseInputDate(parseInputDate) {
        if (arguments.length === 0) {
            return this.currentOptions.parseInputDate;
        }

        if (typeof parseInputDate !== 'function') {
            throw new TypeError('parseInputDate() should be as function');
        }

        this.currentOptions.parseInputDate = parseInputDate;
    }

    disabledTimeIntervals(disabledTimeIntervals) {
        if (arguments.length === 0) {
            return this.currentOptions.disabledTimeIntervals ? $.extend({}, this.currentOptions.disabledTimeIntervals) : this.currentOptions.disabledTimeIntervals;
        }

        if (!disabledTimeIntervals) {
            this.currentOptions.disabledTimeIntervals = false;
            this.update();
            return true;
        }
        if (!(disabledTimeIntervals instanceof Array)) {
            throw new TypeError('disabledTimeIntervals() expects an array parameter');
        }
        this.currentOptions.disabledTimeIntervals = disabledTimeIntervals;
        this.update();
    }

    disabledHours(hours) {
        if (arguments.length === 0) {
            return this.currentOptions.disabledHours ? $.extend({}, this.currentOptions.disabledHours) : this.currentOptions.disabledHours;
        }

        if (!hours) {
            this.currentOptions.disabledHours = false;
            this.update();
            return true;
        }
        if (!(hours instanceof Array)) {
            throw new TypeError('disabledHours() expects an array parameter');
        }
        this.currentOptions.disabledHours = this.indexGivenHours(hours);
        this.currentOptions.enabledHours = false;
        if (this.currentOptions.useCurrent && !this.currentOptions.keepInvalid) {
            for (let i = 0; i < this.dates.length; i++) {
                let tries = 0;
                while (!this.isValid(this.dates[i], 'h')) {
                    this.dates[i].add(1, 'h');
                    if (tries === 24) {
                        throw 'Tried 24 times to find a valid date';
                    }
                    tries++;
                }
                this.setValue(this.dates[i], i);
            }
        }
        this.update();
    }

    enabledHours(hours) {
        if (arguments.length === 0) {
            return this.currentOptions.enabledHours ? $.extend({}, this.currentOptions.enabledHours) : this.currentOptions.enabledHours;
        }

        if (!hours) {
            this.currentOptions.enabledHours = false;
            this.update();
            return true;
        }
        if (!(hours instanceof Array)) {
            throw new TypeError('enabledHours() expects an array parameter');
        }
        this.currentOptions.enabledHours = this.indexGivenHours(hours);
        this.currentOptions.disabledHours = false;
        if (this.currentOptions.useCurrent && !this.currentOptions.keepInvalid) {
            for (let i = 0; i < this.dates.length; i++) {
                let tries = 0;
                while (!this.isValid(this.dates[i], 'h')) {
                    this.dates[i].add(1, 'h');
                    if (tries === 24) {
                        throw 'Tried 24 times to find a valid date';
                    }
                    tries++;
                }
                this.setValue(this.dates[i], i);
            }
        }
        this.update();
    }

    viewDate(newDate) {
        if (arguments.length === 0) {
            return this.currentViewDate.clone();
        }

        if (!newDate) {
            this.currentViewDate = (this.dates[0] || this.getMoment()).clone();
            return true;
        }

        if (typeof newDate !== 'string' && !moment.isMoment(newDate) && !(newDate instanceof Date)) {
            throw new TypeError('viewDate() parameter must be one of [string, moment or Date]');
        }

        this.currentViewDate = this.parseInputDate(newDate);
        this.viewUpdate();
    }

    allowMultidate(allowMultidate) {
        if (typeof allowMultidate !== 'boolean') {
            throw new TypeError('allowMultidate() expects a boolean parameter');
        }

        this.currentOptions.allowMultidate = allowMultidate;
    }

    multidateSeparator(multidateSeparator) {
        if (arguments.length === 0) {
            return this.currentOptions.multidateSeparator;
        }

        if (typeof multidateSeparator !== 'string' || multidateSeparator.length > 1) {
            throw new TypeError('multidateSeparator expects a single character string parameter');
        }

        this.currentOptions.multidateSeparator = multidateSeparator;
    }
}
