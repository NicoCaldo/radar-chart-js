# RadarChartJS.js 🎯

A lightweight, responsive, and customizable radar chart library for modern web applications. Built with vanilla JavaScript, RadarChartJS.js creates beautiful SVG-based radar charts with smooth gradients, dynamic resizing, and interactive features.

## Features ✨

- Pure JavaScript with zero dependencies
- Responsive design with automatic resizing
- Smooth color gradients based on value thresholds
- Dynamic data updates with add/remove capabilities
- Customizable styling and configurations
- SVG-based rendering for crisp visuals
- Support for 3-6 data points
- Automatic value scaling
- Modern visual design with gradients and animations

## Installation 📦 (not yet available)

```bash
npm install
# or
yarn add
```

Or include it directly in your HTML:

```html
<script src=""></script>
```

## Usage 🚀

1. Create a container element:

```html
<div id="radar-chart"></div>
```

2. Initialize the chart:

```javascript
const container = document.getElementById("radar-chart");
const data = {
  Performance: 85,
  Reliability: 92,
  Usability: 78,
  Scalability: 95,
  Security: 88,
};

const options = {
  maxValue: 100, // Optional: defaults to the maximum value in data
};

const chart = new RadarChart(container, data, options);
```

### Dynamic Updates

Add new data points:

```javascript
chart.addDataPoint("Efficiency", 89);
```

Remove existing data points:

```javascript
chart.removeDataPoint("Usability");
```

## API Reference 📚

### Constructor

```javascript
new RadarChart(container, data, options);
```

#### Parameters

- `container`: DOM element to render the chart
- `data`: Object with labels as keys and values as numbers
- `options`: Configuration object (optional)
  - `maxValue`: Maximum value for scaling (default: max value in data)

### Methods

- `addDataPoint(label, value)`: Add a new data point
- `removeDataPoint(label)`: Remove an existing data point
- `resize()`: Manually trigger resize (called automatically on window resize)

## Styling 🎨

The chart uses a color-based threshold system:

- Values 0-33%: Blue (#007EFD)
- Values 34-66%: Yellow (#F5D85E)
- Values 67-100%: Pink (#FC517B)

Custom styling can be achieved through CSS and the options object.

## Browser Support 🌐

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

MIT License

## Author ✍️

Nicola Caldognetto

---

Made with ❤️ for the open-source community
