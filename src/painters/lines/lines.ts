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

export interface TgdPainterLinesOptions {
    /**
     * Flatten array of points:
     * `[ x1, y1, z1, u1, x2, y2, z2, u2, ... ]`
     */
    dataPoint: Float32Array
    texture?: TgdTexture2D
}

export class TgdPainterLines extends TgdPainter {
    public readonly count: number
    public texture: TgdTexture2D
    /**
     * V coord on the texture.
     *
     * It allows you to change the color palette
     * by selecting a line in the texture.
     */
    public v = 0

    private readonly dataPoint: Float32Array
    private readonly textureMustBeDeleted: boolean
    private readonly dataset: TgdDataset
    private readonly program: TgdProgram
    private readonly vao: TgdVertexArray

    constructor(
        public readonly context: TgdContext,
        options: TgdPainterLinesOptions
    ) {
        super()
        this.dataPoint = options.dataPoint
        if ((this.dataPoint.length & 3) !== 0) {
            throw new Error(
                "dataPoint must have a length that is an integral multiple of 4: [x, y, z, radius, ...]!"
            )
        }
        if (options.texture) {
            this.texture = options.texture
            this.textureMustBeDeleted = false
        } else {
            this.texture = new TgdTexture2D(context).loadBitmap(
                tgdCanvasCreateGradientHorizontal(360, getHueWheel(90))
            )
            this.textureMustBeDeleted = true
        }
        this.count = this.dataPoint.length >> 2
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
        const { context, program, vao, texture, count } = this
        const { gl, camera } = context
        program.use()
        texture.activate(0, program, "uniTexture")
        program.uniform1f("uniV", this.v)
        program.uniformMatrix4fv("uniModelViewMatrix", camera.matrixModelView)
        program.uniformMatrix4fv("uniProjectionMatrix", camera.matrixProjection)
        vao.bind()
        gl.drawArrays(gl.LINES, 0, count)
        vao.unbind()
    }

    private createDataset() {
        const dataset = new TgdDataset({
            attPoint: "vec4",
        })
        dataset.set("attPoint", this.dataPoint)
        return dataset
    }

    private createProgram(): TgdProgram {
        const vert = new TgdShaderVertex({
            uniforms: {
                uniV: "float",
                uniModelViewMatrix: "mat4",
                uniProjectionMatrix: "mat4",
            },
            attributes: {
                attPoint: "vec4",
            },
            varying: {
                varUV: "vec2",
            },
            mainCode: [
                "varUV = vec2(attPoint.w, uniV);",
                "vec4 point = vec4(attPoint.xyz, 1.0);",
                "gl_Position = uniProjectionMatrix * uniModelViewMatrix * point;",
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
                "vec4 color = texture(uniTexture, varUV);",
                "FragColor = color;",
            ],
        }).code
        const program = new TgdProgram(this.context.gl, { vert, frag })
        return program
    }
}
