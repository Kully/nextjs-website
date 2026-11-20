---
title: 1000 Images in a Dash
text-preview: How we quickly developed a prototype where you can scrub through 1000 MRI images instantaneously.
image-preview: public/images/portfolio/ucsd.png
video-preview: public/images/portfolio/ucsd-web.mp4
page-url: 1000-images-ucsd
year: 2021
---


## Introduction

With attention spans diminishing and the capabilities of tech going up, it’s no wonder that folks in the world of software expect smoother scrolling, faster loading times, and higher resolution images.

### Speed for Industrial Printing

Dr. Niall O’Dowd, who is in the business of industrial 3D printing, is no stranger to the demands of speedy software.

> In industrial 3d printing, a huge challenge is the real-time delivery of in-process data, which may hold the power to substantially reduce the overall cost of 3d printing. However, the sheer amounts of data being delivered by most real time monitoring systems creates a considerable challenge: information distillation.

- Niall O’Dowd (CEO of Additive Monitoring Systems)

Niall and his team, preparing to build a minimal-viable product (MVP), were faced with a few challenges and desires: to load and sift through hundreds of content-rich images, so as to visually identify any of the “problematic” images.

In the summer of 2021, Niall reached out to Zyphr, provided a requirements list and a user interface vision for the MVP. A few short months later, Zyphr had designed, developed, and implemented the solutions necessary to deem the MVP complete.

The fast scrolling capabilities was turned into a reality.

### Architecting a Solution

While the MVP was built on a strong foundation — Dash, a Python-only web framework popular among data scientists — it was Zyphr’s very own custom Javascript code that granted extreme speed in the image-sifting that Niall wanted.

The trick behind the fast scroll was brought to life with the power of pre-computation. Since Niall’s desired UX was to be able to sift through several hundreds of images with little to no lag time, this meant that any loading needed to occur upon the initial load time.

### The Technical Explanation

All JPEG images were preloaded upon each initialization of the app, and then by hooking up an HTML slider `<input type="range"/>` to the output of a container (i.e. an HTML <div>) in the main layout of the app, then toggling the background-image of the container to point to the corresponding JPEG image, Niall could move this slider and instantly update the background image of the container to the corresponding image based on the slider’s handle position.

> The Zyphr team used Plotly to creatively manage large amounts of data, via an application which rapidly shares important features to 3d printing technicians. The information storage and visualization that they have created allows our system to provide actionable data in real time, a crucial pillar of our value-add.

- Niall O’Dowd (CEO of Additive Monitoring Systems)

#### Other Links
- The Medium article we originally wrote: https://medium.com/zyphr-solutions/ggg-8022a62f3d54
- A YouTube video showcasing the webapp in action: https://www.youtube.com/watch?v=yR8mVbVg37Q&t=2s