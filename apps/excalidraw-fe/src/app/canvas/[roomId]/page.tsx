"use client";

import { useEffect, useRef, useState } from "react";
import rough from "roughjs/bin/rough";
import ExcalidrawNavbar from "./components/navbar";
import { RoughCanvas } from "roughjs/bin/canvas";

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>("selection");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [shapes, setShapes] = useState<Shape[]>([]);
  const rcRef = useRef<RoughCanvas | null>(null);
  const [tempShape, setTempShape] = useState<Shape | null>(null);
  const tempShapeRef = useRef<Shape | null>(null);
  const roughOptions = {
    stroke: "black",
    roughness: 0,
    bowing: 0,
    strokeWidth: 1.75,
    maxRandomnessOffset: 0,
    disableMultiStroke: true,
    disableMultiStrokeFill: true,
  };
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function normaliseRect(
    x: number,
    y: number,
    w: number,
    h: number
  ): { x: number; y: number; width: number; height: number } {
    let nx = x,
      ny = y,
      nw = w,
      nh = h;
    if (nw < 0) {
      nx += nw;
      nw = -nw;
    }
    if (nh < 0) {
      ny += nh;
      nh = -nh;
    }
    return { x: nx, y: ny, width: nw, height: nh };
  }

  function drawArrow(
    rc: RoughCanvas,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    rc.line(x1, y1, x2, y2, roughOptions); // disable randomness in line

    const headLength = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    const arrowHeadPoints: [number, number][] = [
      [x2, y2],
      [
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6),
      ],
      [
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6),
      ],
    ];

    rc.polygon(arrowHeadPoints, roughOptions); // disable randomness in head
  }

  function drawDiamond(
    rc: RoughCanvas,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const points: [number, number][] = [
      [centerX, y],
      [x + width, centerY],
      [centerX, y + height],
      [x, centerY],
    ];

    rc.polygon(points, roughOptions);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = containerRef.current;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d");
    const rc = rough.canvas(canvas);
    rcRef.current = rc;

    const dpr = window.devicePixelRatio || 1;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx?.setTransform(1, 0, 0, 1, 0, 0);
    ctx?.scale(dpr, dpr);

    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      console.log("Mouse Down");
      // if (activeTool !== "rectangle") return;
      const { x, y } = getMousePos(e);
      setIsDrawing(true);
      setStartPoint({ x, y });
      if (activeTool === "text") {
        const { x, y } = getMousePos(e);
        const canvasRect = canvas.getBoundingClientRect();

        setTextInput({
          x: x / dpr + canvasRect.left,
          y: y / dpr + canvasRect.top,
          value: "",
        });

        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);

        return;
      }

      if (activeTool === "freedraw") {
        const { x, y } = getMousePos(e);
        tempShapeRef.current = {
          id: "temp",
          x: x,
          y: y,
          type: activeTool,
          points: [[x, y]],
        };
        setTempShape(tempShapeRef.current);
      } else {
        tempShapeRef.current = {
          id: "temp",
          type: activeTool,
          x,
          y,
          width: 0,
          height: 0,
        };

        setTempShape({
          id: "temp",
          type: activeTool,
          x: x,
          y: y,
          width: 0,
          height: 0,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      console.log("Mouse");
      if (!isDrawing || !startPoint) return;

      const { x: currentX, y: currentY } = getMousePos(e);
      let x, y, width, height, x_2, y_2;
      if (activeTool === "rectangle") {
        ({ x, y, width, height } = normaliseRect(
          startPoint.x,
          startPoint.y,
          currentX - startPoint.x,
          currentY - startPoint.y
        ));
      } else if (activeTool === "ellipse") {
        x = startPoint.x;
        y = startPoint.y;
        width = currentX - startPoint.x;
        height = currentY - startPoint.y;
      } else if (activeTool === "line") {
        x = startPoint.x;
        y = startPoint.y;
        x_2 = currentX;
        y_2 = currentY;
      } else if (activeTool === "diamond") {
        x = startPoint.x;
        y = startPoint.y;
        width = currentX - startPoint.x;
        height = currentY - startPoint.y;
      } else if (activeTool === "arrow") {
        x = startPoint.x;
        y = startPoint.y;
        x_2 = currentX;
        y_2 = currentY;
      }

      if (activeTool === "line" || activeTool === "arrow") {
        tempShapeRef.current = {
          id: "temp",
          type: activeTool,
          x: x!,
          y: y!,
          x_2,
          y_2,
        };

        setTempShape({
          id: "temp",
          type: activeTool,
          x: startPoint.x,
          y: startPoint.y,
          x_2,
          y_2,
        });
      } else if (
        activeTool === "freedraw" &&
        tempShapeRef.current?.type === "freedraw"
      ) {
        const { x, y } = getMousePos(e);
        tempShapeRef.current.points?.push([x, y]);
        setTempShape({ ...tempShapeRef.current });
      } else {
        tempShapeRef.current = {
          id: "temp",
          type: activeTool,
          x: x!,
          y: y!,
          width,
          height,
        };
        setTempShape({
          id: "temp",
          type: activeTool,
          x: startPoint.x,
          y: startPoint.y,
          width,
          height,
        });
      }

      redrawCanvas();
    };

    const handleMouseUp = (e: MouseEvent) => {
      console.log("Mouse UP");
      if (!isDrawing || !startPoint) return;

      const { x: endX, y: endY } = getMousePos(e);
      let x, y, width, height, x_2, y_2;
      if (activeTool === "rectangle") {
        ({ x, y, width, height } = normaliseRect(
          startPoint.x,
          startPoint.y,
          endX - startPoint.x,
          endY - startPoint.y
        ));
      } else if (activeTool === "ellipse") {
        x = startPoint.x;
        y = startPoint.y;
        width = endX - startPoint.x;
        height = endY - startPoint.y;
      } else if (activeTool === "line") {
        x = startPoint.x;
        y = startPoint.y;
        x_2 = endX;
        y_2 = endY;
      } else if (activeTool === "diamond") {
        x = startPoint.x;
        y = startPoint.y;
        width = endX - startPoint.x;
        height = endY - startPoint.y;
      } else if (activeTool === "arrow") {
        x = startPoint.x;
        y = startPoint.y;
        x_2 = endX;
        y_2 = endY;
      } else if (
        activeTool === "freedraw" &&
        tempShapeRef.current?.type === "freedraw"
      ) {
        const finalizedShape = {
          ...tempShapeRef.current,
          id: crypto.randomUUID(),
        };
        setShapes((prev) => [...prev, finalizedShape]);
        tempShapeRef.current = null;
        setTempShape(null);
        setIsDrawing(false);
        redrawCanvas();
        return;
      }

      const newShape: Shape = {
        id: crypto.randomUUID(),
        type: activeTool,
        x: x!,
        y: y!,
        width,
        height,
        x_2,
        y_2,
      };

      setShapes((prev) => [...prev, newShape]);
      setIsDrawing(false);
      setStartPoint(null);
      tempShapeRef.current = null;
      redrawCanvas();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    redrawCanvas();

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeTool, isDrawing, startPoint, shapes]);

  useEffect(() => {
    console.log("Selected tool:", activeTool);
  }, [activeTool]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const rc = rcRef.current;
    if (!canvas || !rc) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale once correctly

    shapes.forEach((shape) => {
      if (shape.type === "rectangle") {
        rc.rectangle(
          shape.x / dpr,
          shape.y / dpr,
          shape.width! / dpr,
          shape.height! / dpr,
          { stroke: "black", roughness: 0, strokeWidth: 1.75 }
        );
      } else if (shape.type === "ellipse") {
        rc.ellipse(
          shape.x / dpr,
          shape.y / dpr,
          shape.width! / dpr,
          shape.height! / dpr,
          { stroke: "black", roughness: 0, strokeWidth: 1.75 }
        );
      } else if (shape.type === "line") {
        rc.line(
          shape.x / dpr,
          shape.y / dpr,
          shape.x_2! / dpr,
          shape.y_2! / dpr,
          { stroke: "black", roughness: 0, strokeWidth: 1.75 }
        );
      } else if (shape.type === "diamond") {
        drawDiamond(
          rc,
          shape.x / dpr,
          shape.y / dpr,
          shape.width! / dpr,
          shape.height! / dpr
        );
      } else if (shape.type === "arrow") {
        drawArrow(
          rc,
          shape.x / dpr,
          shape.y / dpr,
          shape.x_2! / dpr,
          shape.y_2! / dpr
        );
      } else if (shape.type === "freedraw") {
        rc.curve(
          shape.points!.map(([x, y]) => [x / dpr, y / dpr]),
          { stroke: "black", roughness: 0, strokeWidth: 1.75 }
        );
      } else if (shape.type === "text") {
        ctx.font = "32px Arial";
        ctx.fillStyle = "black";
        ctx.fillText(shape.text! || "", shape.x / dpr, shape.y / dpr);
      }
    });

    const tempShape = tempShapeRef.current;
    if (tempShape && tempShape.type === "rectangle") {
      rc.rectangle(
        tempShape.x / dpr,
        tempShape.y / dpr,
        tempShape.width! / dpr,
        tempShape.height! / dpr,
        { stroke: "black", roughness: 0, strokeWidth: 1.75 }
      );
    } else if (tempShape && tempShape.type === "ellipse") {
      rc.ellipse(
        tempShape.x / dpr,
        tempShape.y / dpr,
        tempShape.width! / dpr,
        tempShape.height! / dpr,
        { stroke: "black", roughness: 0, strokeWidth: 1.75 }
      );
    } else if (tempShape && tempShape.type === "line") {
      rc.line(
        tempShape.x / dpr,
        tempShape.y / dpr,
        tempShape.x_2! / dpr,
        tempShape.y_2! / dpr,
        { stroke: "black", roughness: 0, strokeWidth: 1.75 }
      );
    } else if (tempShape && tempShape.type === "diamond") {
      drawDiamond(
        rc,
        tempShape.x / dpr,
        tempShape.y / dpr,
        tempShape.width! / dpr,
        tempShape.height! / dpr
      );
    } else if (tempShape && tempShape.type === "arrow") {
      drawArrow(
        rc,
        tempShape.x / dpr,
        tempShape.y / dpr,
        tempShape.x_2! / dpr,
        tempShape.y_2! / dpr
      );
    } else if (tempShape && tempShape.type === "freedraw" && tempShape.points) {
      rc.curve(
        tempShape.points!.map(([x, y]) => [x / dpr, y / dpr]),
        { stroke: "black", roughness: 0, strokeWidth: 2 }
      );
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [shapes, tempShape]);

  return (
    <div className="w-screen h-screen relative" ref={containerRef}>
      <ExcalidrawNavbar
        activeTool={activeTool}
        onToolChange={(tool) => setActiveTool(tool)}
      />
      <div>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        {textInput && (
          <input
            ref={inputRef}
            type="text"
            style={{
              position: "absolute",
              top: textInput.y,
              left: textInput.x,
              fontSize: "16px",
              padding: "2px",
              backgroundColor: "white",
              border: "none",
              outline: "none",
            }}
            value={textInput.value}
            onChange={(e) =>
              setTextInput((prev) =>
                prev ? { ...prev, value: e.target.value } : null
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && textInput.value.trim() !== "") {
                const dpr = window.devicePixelRatio || 1;
                const canvasRect = canvasRef.current!.getBoundingClientRect();
                const newTextShape = {
                  id: crypto.randomUUID(),
                  type: activeTool,
                  x: (textInput.x - canvasRect.left) * dpr,
                  y: (textInput.y - canvasRect.top) * dpr,
                  text: textInput.value,
                };

                const updatedShapes = [...shapes, newTextShape];
                setShapes(updatedShapes);
                redrawCanvas();
                setTextInput(null);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
