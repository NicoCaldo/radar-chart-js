class RadarChart {
  constructor(container, data, options = {}) {
    this.container = container;
    this.data = data;
    this.options = {
      maxValue: options.maxValue || Math.max(...Object.values(data)),
      labels: Object.keys(data),
      // Base size values for scaling calculations
      baseSize: 400,
      basePadding: 50,
      baseStrokeWidth: 2,
      basePointRadius: 4,
      baseTextSize: 14, // 0.875rem in pixels
      baseLabelDistance: 1.15,
    };

    // Initialize with current container size
    this.updateSize();
    this.calculateDerivedValues();

    this.svgNS = "http://www.w3.org/2000/svg";
    this.colorThresholds = [
      { threshold: 0.33, color: "#007EFD" },
      { threshold: 0.66, color: "#F5D85E" },
      { threshold: 1, color: "#FC517B" },
    ];

    this.init();
    this.setupResizeHandler();
  }

  updateSize() {
    // Get the current container size
    this.currentSize = this.container.clientWidth;
    // Calculate scale factor based on base size
    this.scaleFactor = this.currentSize / this.options.baseSize;
  }

  calculateDerivedValues() {
    this.derived = {
      radius: this.currentSize * 0.37,
      centerX: this.currentSize / 2,
      centerY: this.currentSize / 2,
      angleStep: (2 * Math.PI) / this.options.labels.length,
      // Scale various elements
      padding: this.options.basePadding * this.scaleFactor,
      strokeWidth: this.options.baseStrokeWidth * this.scaleFactor,
      pointRadius: this.options.basePointRadius * this.scaleFactor,
      fontSize: this.options.baseTextSize * this.scaleFactor,
      labelDistance: this.options.baseLabelDistance,
    };
  }

  createSVGElement(type, attributes = {}) {
    const element = document.createElementNS(this.svgNS, type);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }

  getColor(value) {
    const normalized = value / this.options.maxValue;
    return this.colorThresholds.find((t) => normalized <= t.threshold).color;
  }

  getPointCoordinates(value, index, radius = this.derived.radius) {
    const angle = index * this.derived.angleStep - Math.PI / 2;
    const distance = value * radius;
    return {
      x: this.derived.centerX + distance * Math.cos(angle),
      y: this.derived.centerY + distance * Math.sin(angle),
    };
  }

  createGradient(point1, point2, value1, value2, index) {
    const gradient = this.createSVGElement("linearGradient", {
      id: `gradient-${index}`,
      gradientUnits: "userSpaceOnUse",
      x1: point1.x,
      y1: point1.y,
      x2: point2.x,
      y2: point2.y,
    });

    const stops = [
      { offset: "0%", color: this.getColor(value1) },
      { offset: "30%", color: "#137be6" },
      { offset: "70%", color: "#137be6" },
      { offset: "100%", color: this.getColor(value2) },
    ];

    stops.forEach((stop) => {
      gradient.appendChild(
        this.createSVGElement("stop", {
          offset: stop.offset,
          "stop-color": stop.color,
        })
      );
    });

    return gradient;
  }

  createRadialGradient(point, value, index, isOutside = false) {
    const gradientId = `radial-gradient-${isOutside ? "big-" : ""}${index}`;
    const radialGradient = this.createSVGElement("linearGradient", {
      id: gradientId,
      x1: point.x,
      y1: point.y,
      x2: this.derived.centerX,
      y2: this.derived.centerY,
      gradientUnits: "userSpaceOnUse",
    });

    const color = this.getColor(value);
    const stops = [
      {
        offset: "0%",
        color:
          color === "#007EFD"
            ? isOutside
              ? "rgba(0, 126, 253, 0)"
              : "rgb(0, 126, 253, 0.2)"
            : `${color}${isOutside ? "50" : ""}`,
      },
      {
        offset: isOutside ? "25%" : "10%",
        color: "rgb(19, 123, 230, 0)",
      },
    ];

    stops.forEach((stop) => {
      radialGradient.appendChild(
        this.createSVGElement("stop", {
          offset: stop.offset,
          "stop-color": stop.color,
        })
      );
    });

    return radialGradient;
  }

  createBackgroundShapes(svg) {
    [1, 0.8, 0.6, 0.4, 0.2].forEach((level) => {
      const points = Array(this.options.labels.length)
        .fill(null)
        .map((_, i) => {
          const point = this.getPointCoordinates(level, i);
          return `${point.x},${point.y}`;
        })
        .join(" ");

      svg.appendChild(
        this.createSVGElement("polygon", {
          points,
          fill: level === 1 ? "#34393F" : "none",
          stroke: "rgb(209, 213, 219, 0.25)",
          "stroke-width": this.derived.strokeWidth,
        })
      );
    });
  }

  createAxes(svg) {
    Array(this.options.labels.length)
      .fill(null)
      .forEach((_, i) => {
        const endPoint = this.getPointCoordinates(1, i);
        svg.appendChild(
          this.createSVGElement("line", {
            x1: this.derived.centerX,
            y1: this.derived.centerY,
            x2: endPoint.x,
            y2: endPoint.y,
            stroke: "rgb(209, 213, 219, 0.25)",
            "stroke-width": this.derived.strokeWidth,
          })
        );
      });
  }

  createDataPoints(svg, points) {
    const defs = this.createSVGElement("defs");

    // Create line gradients
    points.forEach((point, i) => {
      const nextIndex = (i + 1) % points.length;
      defs.appendChild(
        this.createGradient(
          point,
          points[nextIndex],
          this.data[this.options.labels[i]],
          this.data[this.options.labels[nextIndex]],
          i
        )
      );
    });

    // Create radial gradients for background
    const fullSizePoints = Array(this.options.labels.length)
      .fill(null)
      .map((_, i) => this.getPointCoordinates(1, i));

    fullSizePoints.forEach((point, i) => {
      const nextIndex = (i + 1) % fullSizePoints.length;
      defs.appendChild(
        this.createRadialGradient(
          fullSizePoints[nextIndex],
          this.data[this.options.labels[nextIndex]],
          i,
          true
        )
      );
    });

    svg.appendChild(defs);

    // Create data polygon
    svg.appendChild(
      this.createSVGElement("polygon", {
        points: points.map((p) => `${p.x},${p.y}`).join(" "),
        fill: "rgb(19, 123, 230, 0.2)",
        stroke: "none",
      })
    );

    // Create gradient polygons
    fullSizePoints.forEach((point, i) => {
      const nextIndex = (i + 1) % fullSizePoints.length;
      const nextNextIndex = (i + 2) % fullSizePoints.length;

      const midPoint1 = {
        x: (point.x + fullSizePoints[nextIndex].x) / 2,
        y: (point.y + fullSizePoints[nextIndex].y) / 2,
      };

      const midPoint2 = {
        x: (fullSizePoints[nextIndex].x + fullSizePoints[nextNextIndex].x) / 2,
        y: (fullSizePoints[nextIndex].y + fullSizePoints[nextNextIndex].y) / 2,
      };

      const polygonPoints = [
        midPoint1.x,
        midPoint1.y,
        this.derived.centerX,
        this.derived.centerY,
        midPoint2.x,
        midPoint2.y,
        fullSizePoints[nextIndex].x,
        fullSizePoints[nextIndex].y,
      ].join(" ");

      svg.appendChild(
        this.createSVGElement("polygon", {
          points: polygonPoints,
          fill: `url(#radial-gradient-big-${i})`,
          "fill-opacity": "0.8",
          stroke: "none",
        })
      );
    });

    // Create lines and points
    points.forEach((point, i) => {
      const nextIndex = (i + 1) % points.length;

      // Draw line
      svg.appendChild(
        this.createSVGElement("line", {
          x1: point.x,
          y1: point.y,
          x2: points[nextIndex].x,
          y2: points[nextIndex].y,
          stroke: `url(#gradient-${i})`,
          "stroke-width": this.derived.strokeWidth * 1.5, // Slightly thicker for data lines
        })
      );

      // Draw point
      svg.appendChild(
        this.createSVGElement("circle", {
          cx: point.x,
          cy: point.y,
          r: this.derived.pointRadius,
          fill: this.getColor(this.data[this.options.labels[i]]),
        })
      );
    });
  }

  createLabels(svg) {
    this.options.labels.forEach((label, i) => {
      const point = this.getPointCoordinates(this.derived.labelDistance, i);

      // Calculate angle to determine text alignment
      const angle = (i * (360 / this.options.labels.length) + 270) % 360;

      // Determine text-anchor based on position
      let textAnchor = "start";
      let xOffset = 0;

      if (angle < 45 || angle > 315) {
        // Right side
        xOffset -= 10 * this.scaleFactor;
      } else if (angle >= 45 && angle < 135) {
        // Bottom
        point.y -= 3 * this.scaleFactor;
        xOffset -= 15 * this.scaleFactor;
      } else if (angle >= 135 && angle < 225) {
        // Left side
        xOffset = -20 * this.scaleFactor;
      } else {
        // Top
        point.y -= 7 * this.scaleFactor;
        xOffset -= 15 * this.scaleFactor;
      }

      const text = this.createSVGElement("text", {
        x: point.x + xOffset,
        y: point.y,
        "text-anchor": textAnchor,
        "dominant-baseline": "middle",
        fill: "#d1d5db",
        "font-size": `${this.derived.fontSize}px`,
      });

      const labelSpan = this.createSVGElement("tspan", {
        x: point.x + xOffset,
        dy: "-0.5em",
      });
      labelSpan.textContent = label;

      const valueSpan = this.createSVGElement("tspan", {
        x: point.x + xOffset,
        dy: "1.2em",
        "font-weight": "bold",
        "font-size": `${this.derived.fontSize * 1.5}px`,
      });
      valueSpan.textContent = this.data[label];

      text.appendChild(labelSpan);
      text.appendChild(valueSpan);
      svg.appendChild(text);
    });
  }
  resize() {
    this.updateSize();
    this.calculateDerivedValues();
    this.container.innerHTML = "";
    this.init();
  }

  setupResizeHandler() {
    const debounce = (fn, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    };

    // Use ResizeObserver for more accurate size detection
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(debounce(() => this.resize(), 10));
      ro.observe(this.container);
    } else {
      // Fallback to window resize event
      window.addEventListener(
        "resize",
        debounce(() => this.resize(), 50)
      );
    }
  }

  init() {
    if (Math.max(...Object.values(this.data)) > this.options.maxValue) {
      this.options.maxValue = Math.max(...Object.values(this.data));
      console.warn(
        "The maximum value in the data exceeds the specified `maxValue`. The chart will be scaled accordingly."
      );
    }

    const svg = this.createSVGElement("svg", {
      width: this.currentSize,
      height: this.currentSize,
      //class: "border-solid border-4 border-red-500",
    });

    // Calculate data points once
    const points = this.options.labels.map((label, i) => {
      const value = this.data[label] / this.options.maxValue;
      return this.getPointCoordinates(value, i);
    });

    this.createBackgroundShapes(svg);
    this.createAxes(svg);
    this.createDataPoints(svg, points);
    this.createLabels(svg);

    this.container.appendChild(svg);
  }

  addDataPoint(label, value) {
    // Validate inputs
    if (typeof label !== "string" || typeof value !== "number") {
      throw new Error("Label must be a string and value must be a number");
    }
    if (value < 0) {
      throw new Error("Value must be non-negative");
    }
    if (this.options.labels.includes(label)) {
      throw new Error("Label already exists");
    }
    if (this.options.labels.length > 6) {
      throw new Error("Maximum label count reached");
    }

    // Add new data point
    this.data[label] = value;

    // Update labels
    this.options.labels = Object.keys(this.data);

    // Update maxValue if needed
    if (value > this.options.maxValue) {
      this.options.maxValue = value;
    }

    // Recalculate derived values due to potential label count change
    this.calculateDerivedValues();

    // Clear and redraw the chart
    this.container.innerHTML = "";
    this.init();
  }

  removeDataPoint(label) {
    // Validate input
    if (typeof label !== "string") {
      throw new Error("Label must be a string");
    }
    if (!this.options.labels.includes(label)) {
      throw new Error("Label does not exist");
    }
    if (this.options.labels.length <= 3) {
      throw new Error("Cannot remove data point: minimum of 3 points required");
    }

    // Remove the data point
    delete this.data[label];

    // Update labels
    this.options.labels = Object.keys(this.data);

    // Update maxValue if needed
    this.options.maxValue = Math.max(
      ...Object.values(this.data),
      this.options.maxValue
    );

    // Recalculate derived values due to label count change
    this.calculateDerivedValues();

    // Clear and redraw the chart
    this.container.innerHTML = "";
    this.init();
  }
}
