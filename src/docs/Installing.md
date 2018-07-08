<div class="alert alert-warning">
    This guide still needs a lot of work
</div>

# Minimal Requirements

1. jQuery
2. Moment.js
3. Locales: Moment's locale files are [here](https://github.com/moment/moment/tree/master/locale)
4. Popperjs

# Installation Guides
* [CDN](#cdn)
* [Rails](#rails)
* [Django](#django)
* [Angular](#angular-wrapper)
* [Manual](#manual)

## CDN
```html
<head>
  <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/tempusdominus-datetimepicker/6.0.0/js/tempusdominus-datetimepicker.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tempusdominus-datetimepicker/6.0.0/css/tempusdominus-datetimepicker.min.css" />
</head>
```

## Package Managers

### Rails

Rails 5.1 Support - [Bootstrap 4 Datetime Picker Rails](https://github.com/Bialogs/bootstrap4-datetime-picker-rails)

1. Add `gem 'bootstrap4-datetime-picker-rails'` to your `Gemfile`
2. Execute `bundle`
3. Add `//= require tempusdominus-datetimepicker.js` to your `application.js`
4. Add `@import "tempusdominus-datetimepicker.css"` to your `application.scss`

### Django

Python package for Django: [Django Tempus Dominus](https://pypi.org/project/django-tempus-dominus/)

1. Install via pip: `pip install django-tempus-dominus`
2. Widgets are provided for Date, DateTime, and Time.
3. [Full examples are available with Django Forms, Widgets, and Templates](https://pypi.org/project/django-tempus-dominus/).

### Angular Wrapper

Follow instructions at [ngx-tempusdominus-bootstrap](https://github.com/fetrarij/ngx-tempusdominus-bootstrap) 

## Manual

1. Acquire [jQuery](http://jquery.com)
2. Acquire [Moment.js](https://github.com/moment/moment)
3. Acquire [Popper.js](https://popper.js.org)
```html
<script type="text/javascript" src="/path/to/jquery.js"></script>
<script type="text/javascript" src="/path/to/moment.js"></script>
<script type="text/javascript" src="/path/to/popper.js"></script>
<script type="text/javascript" src="/path/to/tempusdominus-datetimepicker.min.js"></script>
```