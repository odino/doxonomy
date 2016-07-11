# Doxonomy

> Generate system diagrams with ease

![sample](https://raw.githubusercontent.com/odino/doxonomy/master/sample.png)

Doxonomy is a simple library that lets you document
your architecture with ease.

## Installation

Simply create an `index.html` like:

``` html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>My docs</title>
    <link rel="stylesheet" href="/doxonomy.bundle.css">
  </head>
  <body>
  <script src="/doxonomy.bundle.js"></script>
  </body>
</html>
```

> Grab the CSS and JS files from the [release page](https://github.com/odino/doxonomy/releases/tag/1.0.0)

As you can see, we required 2 files, JS and CSS, to bootstrap
a doxonomy project, let's now add an inline script to init our
diagram:

``` html
<script type="text/javascript">
  doxonomy.init({
    url: '/index.yml',
  })
</script>
```

Let's now define the components of our architecture
in the `index.yml` file and we're set:

``` yaml
nodes:
  "ios app":
    level: 1
    icon: /images/smartphone-call.svg
  "android app":
    level: 1
    icon: /images/android.svg
  API:
    level: 2
    icon: /images/api.svg
  database:
    level: 3
    icon: /images/database.svg
  redis:
    level: 3
    icon: /images/redis.svg

relations:
  - from: ios app
    to: API
    label: gets data from
  - from: android app
    to: API
    label: gets data from
  - from: redis
    to: API
    label: reads from
  - from: API
    to: database
    label: writes in
```

and open your `index.html` file from your favorite browser
(though it has been tested on chrome only).

## Credits

* graphs generated through [D3](https://github.com/d3/d3) (mt rusty SVG / D3 skills could use some help)
* sample icons come from [flaticon](http://www.flaticon.com/).

## Development

Just clone this repo and run `npm install && npm start`
(`nodemon` and `http-server` should be the only required, global dependencies).
