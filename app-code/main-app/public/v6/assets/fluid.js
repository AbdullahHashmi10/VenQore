/* WebGL 2D Navier-Stokes Fluid Simulation Engine 
   Locked & Pre-loaded with user's customized Difference preset values */

(function () {
    'use strict';

    const canvas = document.getElementById('fluid-canvas');
    if (!canvas) return;

    window.fluidConfig = {
        SIM_RESOLUTION: 256,
        DYE_RESOLUTION: 2048,
        DENSITY_DISSIPATION: 0.97,
        VELOCITY_DISSIPATION: 0.97,
        PRESSURE: 0.7,
        PRESSURE_ITERATIONS: 20,
        CURL: 12,
        SPLAT_RADIUS: 0.2,
        SPLAT_FORCE: 8500,
        SHADING: false,
        COLORFUL: false,
        PAUSED: false,
        INK_OPACITY: 45.0,
        INVERT_CORE: true,
        CORE_THRESHOLD: 0.1,
        CORE_COLOR: {
            r: 0.047058823529411764,
            g: 0.2235294117647059,
            b: 0.24705882352941178
        },
        SPLAT_COLOR: {          // Splat color set to dark forest green #051414
            r: 0.0196078431372549,
            g: 0.0784313725490196,
            b: 0.0784313725490196
        }
    };

    const config = window.fluidConfig;

    function pointerPrototype() {
        this.id = -1;
        this.texcoordX = 0;
        this.texcoordY = 0;
        this.prevTexcoordX = 0;
        this.prevTexcoordY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.moved = false;
        this.firstMove = true;
    }

    let pointers = [new pointerPrototype()];
    let splatStack = [];

    const { gl, ext } = getWebGLContext(canvas);

    if (!gl) return;

    function getWebGLContext(canvas) {
        const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
        let gl = canvas.getContext('webgl2', params) || canvas.getContext('webgl', params);
        const isWebGL2 = !!gl;

        let halfFloat;
        let supportLinearFiltering;
        if (isWebGL2) {
            gl.getExtension('EXT_color_buffer_float');
            supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
        } else {
            halfFloat = gl.getExtension('OES_texture_half_float');
            supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
        }

        gl.clearColor(0.0, 0.0, 0.0, 0.0);

        const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
        let formatRGBA, formatRG, formatR;

        if (isWebGL2) {
            formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
        } else {
            formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        }

        return {
            gl,
            ext: { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering: !!supportLinearFiltering }
        };
    }

    function getSupportedFormat(gl, internalFormat, format, type) {
        if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
            switch (internalFormat) {
                case gl.R16F: return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                case gl.RG16F: return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                default: return null;
            }
        }
        return { internalFormat, format };
    }

    function supportRenderTextureFormat(gl, internalFormat, format, type) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    }

    class Material {
        constructor(vertexShader, fragmentShaderSource) {
            this.vertexShader = vertexShader;
            this.fragmentShaderSource = fragmentShaderSource;
            this.programs = [];
            this.activeProgram = null;
            this.uniforms = [];
        }

        setKeywords(keywords) {
            let hash = 0;
            for (let i = 0; i < keywords.length; i++) hash += keywords[i].charCodeAt(0);

            let program = this.programs[hash];
            if (!program) {
                let fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
                program = createProgram(gl, this.vertexShader, fragmentShader);
                this.programs[hash] = program;
            }

            if (program !== this.activeProgram) {
                this.uniforms = getUniforms(gl, program);
                this.activeProgram = program;
            }
        }

        bind() { gl.useProgram(this.activeProgram); }
    }

    class Program {
        constructor(vertexShader, fragmentShader) {
            this.program = createProgram(gl, vertexShader, fragmentShader);
            this.uniforms = getUniforms(gl, this.program);
        }

        bind() { gl.useProgram(this.program); }
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        return program;
    }

    function getUniforms(gl, program) {
        let uniforms = [];
        let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let uniformName = gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
        }
        return uniforms;
    }

    function compileShader(gl, type, source, keywords) {
        if (keywords && keywords.length > 0) {
            let keywordsString = '';
            keywords.forEach(k => { keywordsString += '#define ' + k + '\n'; });
            source = keywordsString + source;
        }
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    const baseVertexShader = compileShader(gl, gl.VERTEX_SHADER, `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;
        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `);

    const clearShader = new Program(baseVertexShader, compileShader(gl, gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;
        void main () {
            gl_FragColor = value * texture2D(uTexture, vUv);
        }
    `));

    const splatShader = new Program(baseVertexShader, compileShader(gl, gl.FRAGMENT_SHADER, `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;
        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
    `));

    const advectionShader = new Program(baseVertexShader, compileShader(gl, gl.FRAGMENT_SHADER, `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform vec2 dyeTexelSize;
        uniform float dt;
        uniform float dissipation;
        uniform vec4 uObstacleBox;
        uniform vec2 uScrollOffset;

        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
            vec2 st = uv / tsize - 0.5;
            vec2 iuv = floor(st);
            vec2 fuv = fract(st);

            vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
            vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
            vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
            vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

            return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }

        void main () {
            if (vUv.x >= uObstacleBox.x && vUv.x <= uObstacleBox.z && vUv.y >= uObstacleBox.y && vUv.y <= uObstacleBox.w) {
                gl_FragColor = vec4(0.0);
                return;
            }
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize - uScrollOffset;
            if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) {
                gl_FragColor = vec4(0.0);
                return;
            }
            gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);
            gl_FragColor.a = 1.0;
        }
    `));

    const divergenceShader = new Program(baseVertexShader, compileShader(gl, gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uVelocity, vL).x;
            float R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y;
            float B = texture2D(uVelocity, vB).y;

            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) { L = -C.x; }
            if (vR.x > 1.0) { R = -C.x; }
            if (vT.y > 1.0) { T = -C.y; }
            if (vB.y < 0.0) { B = -C.y; }

            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
    `));

    const curlShader = new Program(baseVertexShader, compileShader(gl, gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
    `));

    const vorticityShader = new Program(baseVertexShader, compileShader(gl, gl.FRAGMENT_SHADER, `
        precision highp float;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;
        void main () {
            float L = texture2D(uCurl, vL).x;
            float R = texture2D(uCurl, vR).x;
            float T = texture2D(uCurl, vT).x;
            float B = texture2D(uCurl, vB).x;
            float C = texture2D(uCurl, vUv).x;

            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C;
            force.y *= -1.0;

            vec2 vel = texture2D(uVelocity, vUv).xy;
            gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
        }
    `));

    const pressureShader = new Program(baseVertexShader, compileShader(gl, gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
    `));

    const gradientSubtractShader = new Program(baseVertexShader, compileShader(gl, gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;
        uniform vec4 uObstacleBox;
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            if (vUv.x >= uObstacleBox.x && vUv.x <= uObstacleBox.z && vUv.y >= uObstacleBox.y && vUv.y <= uObstacleBox.w) {
                velocity = vec2(0.0);
            }
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `));

    const displayShaderSource = `
        precision highp float;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform vec2 texelSize;

        uniform float uInvertCore;
        uniform float uCoreThreshold;
        uniform vec3 uCoreColor;

        void main () {
            vec3 c = texture2D(uTexture, vUv).rgb;
            #ifdef SHADING
                vec3 lc = texture2D(uTexture, vL).rgb;
                vec3 rc = texture2D(uTexture, vR).rgb;
                vec3 tc = texture2D(uTexture, vT).rgb;
                vec3 bc = texture2D(uTexture, vB).rgb;

                float dx = length(rc) - length(lc);
                float dy = length(tc) - length(bc);

                vec3 n = normalize(vec3(dx, dy, length(texelSize)));
                vec3 l = vec3(0.0, 0.0, 1.0);

                float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
                c *= diffuse;
            #endif

            if (uInvertCore > 0.5) {
                float density = max(c.r, max(c.g, c.b));
                float blendFactor = clamp((density - uCoreThreshold) * 1.5, 0.0, 1.0);
                
                vec3 targetColor = uCoreColor * max(density, 0.3);
                c = mix(c, targetColor, blendFactor);
            }

            float a = max(c.r, max(c.g, c.b));
            gl_FragColor = vec4(c, a);
        }
    `;

    const displayMaterial = new Material(baseVertexShader, displayShaderSource);

    function blit(target) {
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        if (target == null) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    let dye, velocity, divergence, curl, pressure;

    function initFramebuffers() {
        let simRes = getResolution(config.SIM_RESOLUTION);
        let dyeRes = getResolution(config.DYE_RESOLUTION);

        const texType = ext.halfFloatTexType;
        const rgba = ext.formatRGBA;
        const rg = ext.formatRG;
        const r = ext.formatR;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

        gl.disable(gl.BLEND);

        dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    function createFBO(w, h, internalFormat, format, type, param) {
        gl.activeTexture(gl.TEXTURE0);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

        let fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        return {
            texture, fbo, width: w, height: h,
            texelSizeX: 1.0 / w, texelSizeY: 1.0 / h,
            attach(id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            }
        };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
        let fbo1 = createFBO(w, h, internalFormat, format, type, param);
        let fbo2 = createFBO(w, h, internalFormat, format, type, param);
        return {
            width: w, height: h,
            texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
            get read() { return fbo1; }, set read(val) { fbo1 = val; },
            get write() { return fbo2; }, set write(val) { fbo2 = val; },
            swap() { let temp = fbo1; fbo1 = fbo2; fbo2 = temp; }
        };
    }

    function getResolution(resolution) {
        let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
        if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
        let min = Math.round(resolution);
        let max = Math.round(resolution * aspectRatio);
        return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }

    function updateKeywords() {
        let displayKeywords = [];
        if (config.SHADING) displayKeywords.push("SHADING");
        displayMaterial.setKeywords(displayKeywords);
    }

    updateKeywords();
    initFramebuffers();

    let lastUpdateTime = Date.now();
    let lastScrollY = window.scrollY;

    function update() {
        const dt = calcDeltaTime();
        if (resizeCanvas()) initFramebuffers();
        applyInputs();
        if (!config.PAUSED) step(dt);
        render(null);
        requestAnimationFrame(update);
    }

    function calcDeltaTime() {
        let now = Date.now();
        let dt = (now - lastUpdateTime) / 1000;
        dt = Math.min(dt, 0.016666);
        lastUpdateTime = now;
        return dt;
    }

    function resizeCanvas() {
        let width = Math.floor(canvas.clientWidth * (window.devicePixelRatio || 1));
        let height = Math.floor(canvas.clientHeight * (window.devicePixelRatio || 1));
        if (canvas.width !== width || canvas.height !== height) {
            let majorChange = canvas.width !== width || Math.abs(canvas.height - height) > 80;
            canvas.width = width;
            canvas.height = height;
            return majorChange;
        }
        return false;
    }

    function applyInputs() {
        if (splatStack.length > 0) {
            let amount = splatStack.pop();
            for (let i = 0; i < amount; i++) {
                const x = Math.random();
                const y = Math.random();
                const dx = 1000 * (Math.random() - 0.5);
                const dy = 1000 * (Math.random() - 0.5);
                
                const color = {
                    r: config.SPLAT_COLOR.r * config.INK_OPACITY,
                    g: config.SPLAT_COLOR.g * config.INK_OPACITY,
                    b: config.SPLAT_COLOR.b * config.INK_OPACITY
                };
                splat(x, y, dx, dy, color);
            }
        }

        pointers.forEach(p => {
            if (p.moved) {
                p.moved = false;
                splatPointer(p);
            }
        });
    }

    function step(dt) {
        gl.disable(gl.BLEND);

        // 1. Calculate scroll offset delta
        let currentScrollY = window.scrollY;
        let deltaScrollY = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;
        let normDeltaY = deltaScrollY / canvas.clientHeight;

        // 2. Calculate obstacle box bounds in normalized WebGL coords [0, 1]
        let obstacleBox = [0, 0, 0, 0];
        const obstacleEl = document.querySelector('.mesh-gradient-card');
        if (obstacleEl) {
            const rect = obstacleEl.getBoundingClientRect();
            // Convert to normalized coordinates relative to fixed viewport
            const minX = rect.left / canvas.clientWidth;
            const maxX = rect.right / canvas.clientWidth;
            const minY = 1.0 - (rect.bottom / canvas.clientHeight);
            const maxY = 1.0 - (rect.top / canvas.clientHeight);
            obstacleBox = [minX, minY, maxX, maxY];
        }

        curlShader.bind();
        gl.uniform2f(curlShader.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(curlShader.uniforms.uVelocity, velocity.read.attach(0));
        blit(curl);

        vorticityShader.bind();
        gl.uniform2f(vorticityShader.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(vorticityShader.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(vorticityShader.uniforms.uCurl, curl.attach(1));
        gl.uniform1f(vorticityShader.uniforms.curl, config.CURL);
        gl.uniform1f(vorticityShader.uniforms.dt, dt);
        blit(velocity.write);
        velocity.swap();

        divergenceShader.bind();
        gl.uniform2f(divergenceShader.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(divergenceShader.uniforms.uVelocity, velocity.read.attach(0));
        blit(divergence);

        clearShader.bind();
        gl.uniform1i(clearShader.uniforms.uTexture, pressure.read.attach(0));
        gl.uniform1f(clearShader.uniforms.value, config.PRESSURE);
        blit(pressure.write);
        pressure.swap();

        pressureShader.bind();
        gl.uniform2f(pressureShader.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(pressureShader.uniforms.uDivergence, divergence.attach(0));
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
            gl.uniform1i(pressureShader.uniforms.uPressure, pressure.read.attach(1));
            blit(pressure.write);
            pressure.swap();
        }

        gradientSubtractShader.bind();
        gl.uniform2f(gradientSubtractShader.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(gradientSubtractShader.uniforms.uPressure, pressure.read.attach(0));
        gl.uniform1i(gradientSubtractShader.uniforms.uVelocity, velocity.read.attach(1));
        gl.uniform4f(gradientSubtractShader.uniforms.uObstacleBox, obstacleBox[0], obstacleBox[1], obstacleBox[2], obstacleBox[3]);
        blit(velocity.write);
        velocity.swap();

        advectionShader.bind();
        gl.uniform2f(advectionShader.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform2f(advectionShader.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
        let velocityId = velocity.read.attach(0);
        gl.uniform1i(advectionShader.uniforms.uVelocity, velocityId);
        gl.uniform1i(advectionShader.uniforms.uSource, velocityId);
        gl.uniform1f(advectionShader.uniforms.dt, dt);
        gl.uniform1f(advectionShader.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        gl.uniform4f(advectionShader.uniforms.uObstacleBox, obstacleBox[0], obstacleBox[1], obstacleBox[2], obstacleBox[3]);
        gl.uniform2f(advectionShader.uniforms.uScrollOffset, 0.0, normDeltaY);
        blit(velocity.write);
        velocity.swap();

        gl.uniform2f(advectionShader.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform2f(advectionShader.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
        gl.uniform1i(advectionShader.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(advectionShader.uniforms.uSource, dye.read.attach(1));
        gl.uniform1f(advectionShader.uniforms.dissipation, config.DENSITY_DISSIPATION);
        gl.uniform4f(advectionShader.uniforms.uObstacleBox, obstacleBox[0], obstacleBox[1], obstacleBox[2], obstacleBox[3]);
        gl.uniform2f(advectionShader.uniforms.uScrollOffset, 0.0, normDeltaY);
        blit(dye.write);
        dye.swap();
    }

    function render(target) {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);

        updateKeywords();
        displayMaterial.bind();
        gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / gl.drawingBufferWidth, 1.0 / gl.drawingBufferHeight);
        gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
        
        gl.uniform1f(displayMaterial.uniforms.uInvertCore, config.INVERT_CORE ? 1.0 : 0.0);
        gl.uniform1f(displayMaterial.uniforms.uCoreThreshold, config.CORE_THRESHOLD);
        gl.uniform3f(displayMaterial.uniforms.uCoreColor, config.CORE_COLOR.r, config.CORE_COLOR.g, config.CORE_COLOR.b);

        blit(target);
    }

    function splatPointer(pointer) {
        let dx = pointer.deltaX * config.SPLAT_FORCE;
        let dy = pointer.deltaY * config.SPLAT_FORCE;
        
        const color = {
            r: config.SPLAT_COLOR.r * config.INK_OPACITY,
            g: config.SPLAT_COLOR.g * config.INK_OPACITY,
            b: config.SPLAT_COLOR.b * config.INK_OPACITY
        };
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color);
    }

    function splat(x, y, dx, dy, color) {
        splatShader.bind();
        gl.uniform1i(splatShader.uniforms.uTarget, velocity.read.attach(0));
        gl.uniform1f(splatShader.uniforms.aspectRatio, canvas.clientWidth / canvas.clientHeight);
        gl.uniform2f(splatShader.uniforms.point, x, y);
        gl.uniform3f(splatShader.uniforms.color, dx, dy, 0.0);
        gl.uniform1f(splatShader.uniforms.radius, config.SPLAT_RADIUS / 100.0);
        blit(velocity.write);
        velocity.swap();

        gl.uniform1i(splatShader.uniforms.uTarget, dye.read.attach(0));
        gl.uniform3f(splatShader.uniforms.color, color.r, color.g, color.b);
        blit(dye.write);
        dye.swap();
    }

    window.addEventListener('mousemove', e => {
        let pointer = pointers[0];
        let posX = e.clientX * (window.devicePixelRatio || 1);
        let posY = e.clientY * (window.devicePixelRatio || 1);
        updatePointerMoveData(pointer, posX, posY);
    });

    window.addEventListener('touchstart', e => {
        let pointer = pointers[0];
        if (e.targetTouches.length > 0) {
            let posX = e.targetTouches[0].clientX * (window.devicePixelRatio || 1);
            let posY = e.targetTouches[0].clientY * (window.devicePixelRatio || 1);
            let tx = Math.max(0, Math.min(1, posX / canvas.width));
            let ty = Math.max(0, Math.min(1, 1.0 - posY / canvas.height));
            pointer.texcoordX = tx;
            pointer.texcoordY = ty;
            pointer.prevTexcoordX = tx;
            pointer.prevTexcoordY = ty;
            pointer.deltaX = 0;
            pointer.deltaY = 0;
            pointer.moved = false;
            pointer.firstMove = false;
        }
    }, { passive: true });

    window.addEventListener('touchmove', e => {
        let pointer = pointers[0];
        if (e.targetTouches.length > 0) {
            let posX = e.targetTouches[0].clientX * (window.devicePixelRatio || 1);
            let posY = e.targetTouches[0].clientY * (window.devicePixelRatio || 1);
            updatePointerMoveData(pointer, posX, posY);
        }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        let pointer = pointers[0];
        pointer.firstMove = true;
        pointer.moved = false;
    });

    function updatePointerMoveData(pointer, posX, posY) {
        let tx = Math.max(0, Math.min(1, posX / canvas.width));
        let ty = Math.max(0, Math.min(1, 1.0 - posY / canvas.height));
        
        if (pointer.firstMove) {
            pointer.texcoordX = tx;
            pointer.texcoordY = ty;
            pointer.prevTexcoordX = tx;
            pointer.prevTexcoordY = ty;
            pointer.deltaX = 0;
            pointer.deltaY = 0;
            pointer.firstMove = false;
            return;
        }

        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.texcoordX = tx;
        pointer.texcoordY = ty;
        pointer.deltaX = pointer.texcoordX - pointer.prevTexcoordX;
        pointer.deltaY = pointer.texcoordY - pointer.prevTexcoordY;

        let dist = Math.hypot(pointer.deltaX, pointer.deltaY);
        if (dist > 0.3) {
            pointer.prevTexcoordX = pointer.texcoordX;
            pointer.prevTexcoordY = pointer.texcoordY;
            pointer.deltaX = 0;
            pointer.deltaY = 0;
            pointer.moved = false;
            return;
        }

        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    }

    window.reinitFluidFramebuffers = function() {
        initFramebuffers();
    };

    window.triggerManualSplats = function(amount) {
        splatStack.push(amount);
    };

    // Trigger initial burst so fluid dynamics are alive immediately on load
    window.triggerManualSplats(Math.floor(Math.random() * 4) + 4);

    requestAnimationFrame(update);
})();
