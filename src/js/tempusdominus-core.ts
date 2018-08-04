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

    private getDatePickerTemplate() {
        const headTemplate = document.createElement('thead'),
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
            ;

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


        

        return [document.createElement('div').addClass('datepicker-days')
            .append(document.createElement('table').addClass('table table-sm')
                .append(headTemplate)
                .append(document.createElement('tbody'))),

 document.createElement('div').addClass('datepicker-months')
                    .append(document.createElement('table').addClass('table-condensed')
                        .append(headTemplate.clone())
                    .append(contTemplate.clone())),


            document.createElement('div').addClass('datepicker-years')
                            .append(document.createElement('table').addClass('table-condensed')
                                .append(headTemplate.clone())
                    .append(contTemplate.clone())),


            document.createElement('div').addClass('datepicker-decades')
                                    .append(document.createElement('table').addClass('table-condensed')
                                        .append(headTemplate.clone())
                                        .append(contTemplate.clone()))];
    }

    private getTimePickerMainTemplate() {
        const topRow = document.createElement('tr'),
            middleRow = document.createElement('tr'),
            bottomRow = document.createElement('tr');

        if (this.isEnabled('h')) {
            topRow
                .append(document.createElement('td')
                    .append(document.createElement('a').attr({
                        href: '#',
                        tabindex: '-1',
                        'title': this.currentOptions.tooltips.incrementHour
                    }).addClass('btn').setAttribute('data-action', 'incrementHours')
                        .append(document.createElement('span').addClass(this.currentOptions.icons.up))));
            middleRow
                .append(document.createElement('td')
                    .append(document.createElement('span').addClass('timepicker-hour').attr({
                        'data-time-component': 'hours',
                        'title': this.currentOptions.tooltips.pickHour
                    }).setAttribute('data-action', 'showHours')));
            bottomRow
                .append(document.createElement('td')
                    .append(document.createElement('a').attr({
                        href: '#',
                        tabindex: '-1',
                        'title': this.currentOptions.tooltips.decrementHour
                    }).addClass('btn').setAttribute('data-action', 'decrementHours')
                        .append(document.createElement('span').addClass(this.currentOptions.icons.down))));
        }
        if (this.isEnabled('m')) {
            if (this.isEnabled('h')) {
                topRow
                    .append(document.createElement('td').addClass('separator'));
                middleRow
                    .append(document.createElement('td').addClass('separator').html(':'));
                bottomRow
                    .append(document.createElement('td').addClass('separator'));
            }
            topRow
                .append(document.createElement('td')
                    .append(document.createElement('a').attr({
                        href: '#',
                        tabindex: '-1',
                        'title': this.currentOptions.tooltips.incrementMinute
                    }).addClass('btn').setAttribute('data-action', 'incrementMinutes')
                        .append(document.createElement('span').addClass(this.currentOptions.icons.up))));
            middleRow
                .append(document.createElement('td')
                    .append(document.createElement('span').addClass('timepicker-minute').attr({
                        'data-time-component': 'minutes',
                        'title': this.currentOptions.tooltips.pickMinute
                    }).setAttribute('data-action', 'showMinutes')));
            bottomRow
                .append(document.createElement('td')
                    .append(document.createElement('a').attr({
                        href: '#',
                        tabindex: '-1',
                        'title': this.currentOptions.tooltips.decrementMinute
                    }).addClass('btn').setAttribute('data-action', 'decrementMinutes')
                        .append(document.createElement('span').addClass(this.currentOptions.icons.down))));
        }
        if (this.isEnabled('s')) {
            if (this.isEnabled('m')) {
                topRow
                    .append(document.createElement('td').addClass('separator'));
                middleRow
                    .append(document.createElement('td').addClass('separator').html(':'));
                bottomRow
                    .append(document.createElement('td').addClass('separator'));
            }
            topRow
                .append(document.createElement('td')
                    .append(document.createElement('a').attr({
                        href: '#',
                        tabindex: '-1',
                        'title': this.currentOptions.tooltips.incrementSecond
                    }).addClass('btn').setAttribute('data-action', 'incrementSeconds')
                        .append(document.createElement('span').addClass(this.currentOptions.icons.up))));
            middleRow
                .append(document.createElement('td')
                    .append(document.createElement('span').addClass('timepicker-second').attr({
                        'data-time-component': 'seconds',
                        'title': this.currentOptions.tooltips.pickSecond
                    }).setAttribute('data-action', 'showSeconds')));
            bottomRow
                .append(document.createElement('td')
                    .append(document.createElement('a').attr({
                        href: '#',
                        tabindex: '-1',
                        'title': this.currentOptions.tooltips.decrementSecond
                    }).addClass('btn').setAttribute('data-action', 'decrementSeconds')
                        .append(document.createElement('span').addClass(this.currentOptions.icons.down))));
        }

        if (!this.use24Hours) {
            topRow
                .append(document.createElement('td').addClass('separator'));
            middleRow
                .append(document.createElement('td')
                    .append(document.createElement('button').addClass('btn btn-primary').attr({
                        'data-action': 'togglePeriod',
                        tabindex: '-1',
                        'title': this.currentOptions.tooltips.togglePeriod
                    })));
            bottomRow
                .append(document.createElement('td').addClass('separator'));
        }

        return document.createElement('div').addClass('timepicker-picker')
            .append(document.createElement('table').addClass('table-condensed')
                .append([topRow, middleRow, bottomRow]));
    }

    private getTimePickerTemplate() {
        const hoursView = document.createElement('div').addClass('timepicker-hours')
            .append(document.createElement('table').addClass('table-condensed')),
            minutesView = document.createElement('div').addClass('timepicker-minutes')
                .append(document.createElement('table').addClass('table-condensed')),
            secondsView = document.createElement('div').addClass('timepicker-seconds')
                .append(document.createElement('table').addClass('table-condensed')),
            ret = [this.getTimePickerMainTemplate()];

        if (this.isEnabled('h')) {
            ret.push(hoursView);
        }
        if (this.isEnabled('m')) {
            ret.push(minutesView);
        }
        if (this.isEnabled('s')) {
            ret.push(secondsView);
        }

        return ret;
    }

    private getToolbar() {
        const row = [];
        if (this.currentOptions.buttons.showToday) {
            row.push(document.createElement('td')
                .append(document.createElement('a').attr({
                    href: '#',
                    tabindex: '-1',
                    'data-action': 'today',
                    'title': this.currentOptions.tooltips.today
                })
                    .append(document.createElement('span').addClass(this.currentOptions.icons.today))));
        }
        if (!this.currentOptions.sideBySide && this.hasDate() && this.hasTime()) {
            let title, icon;
            if (this.currentOptions.viewMode === 'times') {
                title = this.currentOptions.tooltips.selectDate;
                icon = this.currentOptions.icons.date;
            } else {
                title = this.currentOptions.tooltips.selectTime;
                icon = this.currentOptions.icons.time;
            }
            row.push(document.createElement('td')
                .append(document.createElement('a').attr({
                    href: '#',
                    tabindex: '-1',
                    'data-action': 'togglePicker',
                    'title': title
                })
                    .append(document.createElement('span').addClass(icon))));
        }
        if (this.currentOptions.buttons.showClear) {
            row.push(document.createElement('td')
                .append(document.createElement('a').attr({
                    href: '#',
                    tabindex: '-1',
                    'data-action': 'clear',
                    'title': this.currentOptions.tooltips.clear
                })
                    .append(document.createElement('span').addClass(this.currentOptions.icons.clear))));
        }
        if (this.currentOptions.buttons.showClose) {
            row.push(document.createElement('td')
                .append(document.createElement('a').attr({
                    href: '#',
                    tabindex: '-1',
                    'data-action': 'close',
                    'title': this.currentOptions.tooltips.close
                })
                    .append(document.createElement('span').addClass(this.currentOptions.icons.close))));
        }
        return row.length === 0 ? '' : document.createElement('table').addClass('table-condensed')
            .append(document.createElement('tbody')
                .append(document.createElement('tr')
                    .append(row)));
    }

    private getTemplate() {
        const template = document.createElement('div').addClass('bootstrap-datetimepicker-widget dropdown-menu'),
            dateView = document.createElement('div').addClass('datepicker')
                .append(this.getDatePickerTemplate()),
            timeView = document.createElement('div').addClass('timepicker')
                .append(this.getTimePickerTemplate()),
            content = document.createElement('ul').addClass('list-unstyled'),
            toolbar = document.createElement('li').addClass(`picker-switch${this.currentOptions.collapse ? ' accordion-toggle' : ''}`)
                .append(this.getToolbar());

        if (this.currentOptions.inline) {
            template.removeClass('dropdown-menu');
        }

        if (this.use24Hours) {
            template.addClass('usetwentyfour');
        }
        if (this.isEnabled('s') && !this.use24Hours) {
            template.addClass('wider');
        }

        if (this.currentOptions.sideBySide && this.hasDate() && this.hasTime()) {
            template.addClass('timepicker-sbs');
            if (this.currentOptions.toolbarPlacement === 'top') {
                template
                    .append(toolbar);
            }
            template
                .append(document.createElement('div').addClass('row')
                    .append(dateView.addClass('col-md-6'))
                    .append(timeView.addClass('col-md-6')));
            if (this.currentOptions.toolbarPlacement === 'bottom' || this.currentOptions.toolbarPlacement === 'default') {
                template
                    .append(toolbar);
            }
            return template;
        }

        if (this.currentOptions.toolbarPlacement === 'top') {
            content
                .append(toolbar);
        }
        if (this.hasDate()) {
            content
                .append(document.createElement('li').addClass(this.currentOptions.collapse && this.hasTime() ? 'collapse' : '')
                    .addClass((this.currentOptions.collapse && this.hasTime() && this.currentOptions.viewMode === 'times' ? '' : 'show'))

                    .append(dateView));
        }
        if (this.currentOptions.toolbarPlacement === 'default') {
            content
                .append(toolbar);
        }
        if (this.hasTime()) {
            content
                .append(document.createElement('li').addClass(this.currentOptions.collapse && this.hasDate() ? 'collapse' : '')
                    .addClass((this.currentOptions.collapse && this.hasDate() && this.currentOptions.viewMode === 'times' ? 'show' : ''))

                    .append(timeView));
        }
        if (this.currentOptions.toolbarPlacement === 'bottom') {
            content
                .append(toolbar);
        }
        return template
            .append(content);
    }

    private place(e?) {
        const self = (e && e.data && e.data.picker) || this;
        if (self.options.sideBySide) {
            self.element
                .append(self.widget);
            return;
        }
        if (self.options.widgetParent) {
            self.options.widgetParent
                .append(self.widget);
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
            row
                .append(document.createElement('th').addClass('cw').text('#'));
        }

        while (currentDate.isBefore(this.currentViewDate.clone().endOf('w'))) {
            row
                .append(document.createElement('th').addClass('dow').text(currentDate.format('dd')));
            currentDate.add(1, 'd');
        }
        this.widget.querySelectorAll('.datepicker-days thead')[0]
            .append(row);
    }

    private fillMonths() {
        const spans = [],
            monthsShort = this.currentViewDate.clone().startOf('y').startOf('d');
        while (monthsShort.isSame(this.currentViewDate, 'y')) {
            spans.push(document.createElement('span').setAttribute('data-action', 'selectMonth').addClass('month').text(monthsShort.format('MMM')));
            monthsShort.add(1, 'M');
        }
        this.widget.querySelectorAll('.datepicker-months td')[0].empty()
            .append(spans);
    }

    private updateMonths() {
        const monthsView = this.widget.querySelectorAll('.datepicker-months')[0],
            monthsViewHeader = monthsView.querySelectorAll('th')[0],
            months = monthsView.querySelectorAll('tbody')[0].querySelectorAll('span')[0], self = this;

        monthsViewHeader.eq(0).querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.prevYear);
        monthsViewHeader.eq(1).attr('title', this.currentOptions.tooltips.selectYear);
        monthsViewHeader.eq(2).querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.nextYear);

        monthsView.querySelectorAll('.disabled').removeClass('disabled')[0];

        if (!this.isValid(this.currentViewDate.clone().subtract(1, 'y'), 'y')) {
            monthsViewHeader.eq(0).addClass('disabled');
        }

        monthsViewHeader.eq(1).text(this.currentViewDate.year());

        if (!this.isValid(this.currentViewDate.clone().add(1, 'y'), 'y')) {
            monthsViewHeader.eq(2).addClass('disabled');
        }

        months.removeClass('active');
        if (this.getLastPickedDate().isSame(this.currentViewDate, 'y') && !this.unset) {
            months.eq(this.getLastPickedDate().month()).addClass('active');
        }

        months.each(function (index) {
            if (!self.isValid(self.viewDate.clone().month(index), 'M')) {
                $(this).addClass('disabled');
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

        yearsViewHeader.eq(0).querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.prevDecade);
        yearsViewHeader.eq(1).attr('title', this.currentOptions.tooltips.selectDecade);
        yearsViewHeader.eq(2).querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.nextDecade);

        yearsView.querySelectorAll('.disabled').removeClass('disabled')[0];

        if (this.currentOptions.minDate && this.currentOptions.minDate.isAfter(startYear, 'y')) {
            yearsViewHeader.eq(0).addClass('disabled');
        }

        yearsViewHeader.eq(1).text(`${startYear.year()}-${endYear.year()}`);

        if (this.currentOptions.maxDate && this.currentOptions.maxDate.isBefore(endYear, 'y')) {
            yearsViewHeader.eq(2).addClass('disabled');
        }

        html += `<span data-action="selectYear" class="year old${!this.isValid(startYear, 'y') ? ' disabled' : ''}">${startYear.year() - 1}</span>`;
        while (!startYear.isAfter(endYear, 'y')) {
            html += `<span data-action="selectYear" class="year${startYear.isSame(this.getLastPickedDate(), 'y') && !this.unset ? ' active' : ''}${!this.isValid(startYear, 'y') ? ' disabled' : ''}">${startYear.year()}</span>`;
            startYear.add(1, 'y');
        }
        html += `<span data-action="selectYear" class="year old${!this.isValid(startYear, 'y') ? ' disabled' : ''}">${startYear.year()}</span>`;

        yearsView.querySelectorAll('td')[0].html(html);
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

        decadesViewHeader.eq(0).querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.prevCentury);
        decadesViewHeader.eq(2).querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.nextCentury);

        decadesView.querySelectorAll('.disabled').removeClass('disabled')[0];

        if (startDecade.year() === 0 || this.currentOptions.minDate && this.currentOptions.minDate.isAfter(startDecade, 'y')) {
            decadesViewHeader.eq(0).addClass('disabled');
        }

        decadesViewHeader.eq(1).text(`${startDecade.year()}-${endDecade.year()}`);

        if (this.currentOptions.maxDate && this.currentOptions.maxDate.isBefore(endDecade, 'y')) {
            decadesViewHeader.eq(2).addClass('disabled');
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
        let currentDate, row, clsName, i;

        if (!this.hasDate()) {
            return;
        }

        daysViewHeader.eq(0).querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.prevMonth);
        daysViewHeader.eq(1).attr('title', this.currentOptions.tooltips.selectMonth);
        daysViewHeader.eq(2).querySelectorAll('span')[0].attr('title', this.currentOptions.tooltips.nextMonth);

        daysView.querySelectorAll('.disabled').removeClass('disabled')[0];
        daysViewHeader.eq(1).text(this.currentViewDate.format(this.currentOptions.dayViewHeaderFormat));

        if (!this.isValid(this.currentViewDate.clone().subtract(1, 'M'), 'M')) {
            daysViewHeader.eq(0).addClass('disabled');
        }
        if (!this.isValid(this.currentViewDate.clone().add(1, 'M'), 'M')) {
            daysViewHeader.eq(2).addClass('disabled');
        }

        currentDate = this.currentViewDate.clone().startOf('M').startOf('w').startOf('d');

        for (i = 0; i < 42; i++) {
            //always display 42 days (should show 6 weeks)
            if (currentDate.weekday() === 0) {
                row = document.createElement('tr');
                if (this.currentOptions.calendarWeeks) {
                    row
                        .append(`<td class="cw">${currentDate.week()}</td>`);
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
                .append(`<td data-action="selectDay" data-day="${currentDate.format('L')}" class="day${clsName}">${currentDate.date()}</td>`);
            currentDate.add(1, 'd');
        }

        daysView.querySelectorAll('tbody')[0].empty()
            .append(html);

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
                .append(`<td data-action="selectHour" class="hour${!this.isValid(currentHour, 'h') ? ' disabled' : ''}">${currentHour.format(this.use24Hours ? 'HH' : 'hh')}</td>`);
            currentHour.add(1, 'h');
        }
        table.empty()
            .append(html);
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
                .append(`<td data-action="selectMinute" class="minute${!this.isValid(currentMinute, 'm') ? ' disabled' : ''}">${currentMinute.format('mm')}</td>`);
            currentMinute.add(step, 'm');
        }
        table.empty()
            .append(html);
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
                .append(`<td data-action="selectSecond" class="second${!this.isValid(currentSecond, 's') ? ' disabled' : ''}">${currentSecond.format('ss')}</td>`);
            currentSecond.add(5, 's');
        }

        table.empty()
            .append(html);
    }

    private fillTime() {
        let toggle, newDate;
        const timeComponents = this.widget.querySelectorAll('.timepicker span[data-time-component]')[0];

        if (!this.use24Hours) {
            toggle = this.widget.querySelectorAll('.timepicker [data-action=togglePeriod]')[0];
            newDate = this.getLastPickedDate().clone().add(this.getLastPickedDate().hours() >= 12 ? -12 : 12, 'h');

            toggle.text(this.getLastPickedDate().format('A'));

            if (this.isValid(newDate, 'h')) {
                toggle.removeClass('disabled');
            } else {
                toggle.addClass('disabled');
            }
        }
        timeComponents.filter('[data-time-component=hours]').text(this.getLastPickedDate().format(`${this.use24Hours ? 'HH' : 'hh'}`));
        timeComponents.filter('[data-time-component=minutes]').text(this.getLastPickedDate().format('mm'));
        timeComponents.filter('[data-time-component=seconds]').text(this.getLastPickedDate().format('ss'));

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

                    var selectDate = day.date(parseInt($(e.target).text(), 10)), index;
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
                            expanded.removeClass('show');
                            closed.addClass('show');
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
                    let hour = parseInt($(e.target).text(), 10);

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
                this.setValue(lastPicked.clone().minutes(parseInt($(e.target).text(), 10)), this.getLastPickedDateIndex());
                if (!this.isEnabled('a') && !this.isEnabled('s') && !this.currentOptions.keepOpen && !this.currentOptions.inline) {
                    this.hide();
                }
                else {
                    this.doAction(e, 'showPicker');
                }
                break;
            case 'selectSecond':
                this.setValue(lastPicked.clone().seconds(parseInt($(e.target).text(), 10)), this.getLastPickedDateIndex());
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
            index2,
            keyBindKeys,
            allModifiersPressed;
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
        let currentMoment;
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
            this.component.addClass('disabled');
        }
        if (this.input !== undefined) {
            this.input.prop('disabled', true); //todo disable this/comp if input is null
        }
    }

    enable() {
        if (this.component && this.component.classList.contains('btn')) {
            this.component.removeClass('disabled');
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
