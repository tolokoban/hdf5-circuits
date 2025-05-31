import { getHueWheel } from "@/utils/colors"
import {
    tgdCanvasCreateGradientHorizontal,
    TgdContext,
    TgdDataset,
    TgdPainter,
    TgdProgram,
    TgdShaderFragment,
    TgdShaderVertex,
    TgdTexture2D,
    TgdVertexArray,
} from "@tolokoban/tgd"

export interface TgdPainterPointsCloudOptions {
    /**
     * Flatten array of points:
     * `[ x1, y1, z1, radius1, x2, y2, z2, radius2, ... ]`
     */
    dataPoint: Float32Array
    /**
     * Flatten array of UVs:
     * `[ u1, v1, u2, v2, ... ]`
     */
    dataUV?: Float32Array
    /**
     * Multiply the radius of each point by this value.
     *
     * Default to 1.
     */
    radiusMultiplier?: number
    /**
     * Depending on the radius and the distance to the camera,
     * the point can be invisible.
     * This value is the minimum size of the point in pixels.
     *
     * Default to 0.
     */
    minSizeInPixels?: number
    texture?: TgdTexture2D
}

export class TgdPainterPointsCloud extends TgdPainter {
    public readonly count: number
    public texture: TgdTexture2D
    public radiusMultiplier = 1
    public minSizeInPixels = 0

    private readonly dataPoint: Float32Array
    private readonly dataUV: Float32Array
    private readonly textureMustBeDeleted: boolean
    private readonly dataset: TgdDataset
    private readonly program: TgdProgram
    private readonly vao: TgdVertexArray

    constructor(
        public readonly context: TgdContext,
        options: TgdPainterPointsCloudOptions
    ) {
        super()
        this.radiusMultiplier = options.radiusMultiplier ?? 1
        this.minSizeInPixels = options.minSizeInPixels ?? 0
        this.dataPoint = options.dataPoint
        if ((this.dataPoint.length & 3) !== 0) {
            throw new Error(
                "dataPoint must have a length that is an integral multiple of 4: [x, y, z, radius, ...]!"
            )
        }
        this.dataUV =
            options.dataUV ?? new Float32Array(this.dataPoint.length >> 1)
        if (this.dataPoint.length !== this.dataUV.length * 2) {
            throw new Error(
                "dataUV must be half of the size of dataPoint: [u, v, ...]!"
            )
        }
        if (options.texture) {
            this.texture = options.texture
            this.textureMustBeDeleted = false
        } else {
            this.texture = new TgdTexture2D(context).loadBitmap(
                tgdCanvasCreateGradientHorizontal(360, getHueWheel())
            )
            this.textureMustBeDeleted = true
        }
        this.count = this.dataUV.length >> 1
        this.dataset = this.createDataset()
        this.program = this.createProgram()
        this.vao = new TgdVertexArray(context.gl, this.program, [this.dataset])
    }

    delete(): void {
        if (this.textureMustBeDeleted) this.texture.delete()
        this.program.delete()
        this.vao.delete()
    }

    paint(time: number, delay: number): void {
        const {
            context,
            program,
            vao,
            texture,
            count,
            radiusMultiplier,
            minSizeInPixels,
        } = this
        const { gl, camera } = context
        program.use()
        texture.activate(0, program, "uniTexture")
        program.uniform1f("uniRadiusMultiplier", radiusMultiplier)
        program.uniform1f("uniMinSizeInPixels", minSizeInPixels)
        program.uniform1f("uniHalfScreenHeightInPixels", context.height * 0.5)
        program.uniformMatrix4fv("uniModelViewMatrix", camera.matrixModelView)
        program.uniformMatrix4fv("uniProjectionMatrix", camera.matrixProjection)
        vao.bind()
        gl.drawArrays(gl.POINTS, 0, count)
        vao.unbind()
    }

    private createDataset() {
        const dataset = new TgdDataset({
            attPoint: "vec4",
            attUV: "vec2",
        })
        dataset.set("attPoint", this.dataPoint)
        dataset.set("attUV", this.dataUV)
        return dataset
    }

    private createProgram(): TgdProgram {
        const vert = new TgdShaderVertex({
            uniforms: {
                uniMinSizeInPixels: "float",
                uniRadiusMultiplier: "float",
                uniHalfScreenHeightInPixels: "float",
                uniModelViewMatrix: "mat4",
                uniProjectionMatrix: "mat4",
            },
            attributes: {
                attPoint: "vec4",
                attUV: "vec2",
            },
            varying: {
                varUV: "vec2",
            },
            mainCode: [
                "varUV = attUV;",
                "float radius = attPoint.w;",
                "vec4 point = vec4(attPoint.xyz, 1.0);",
                "gl_Position = uniProjectionMatrix * uniModelViewMatrix * point;",
                "gl_PointSize = max(",
                "  uniMinSizeInPixels,",
                "  uniRadiusMultiplier * radius * uniHalfScreenHeightInPixels / gl_Position.w",
                ");",
            ],
        }).code
        const frag = new TgdShaderFragment({
            uniforms: {
                uniTexture: "sampler2D",
            },
            varying: {
                varUV: "vec2",
            },
            outputs: { FragColor: "vec4" },
            mainCode: [
                "vec2 coords = 2.0 * (gl_PointCoord - vec2(.5));",
                "float len = 1.0 - dot(coords, coords);",
                "if (len < 0.0) discard;",
                "vec4 color = texture(uniTexture, varUV);",
                "float light = smoothstep(0.0, 0.5, len);",
                "float spec = pow(len, 2.0) * .5;",
                "FragColor = color * vec4(vec3(light), 1.0) + vec4(vec3(spec), 0.0);",
            ],
        }).code
        const program = new TgdProgram(this.context.gl, { vert, frag })
        return program
    }
}
