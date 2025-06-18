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
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  const roughOptions = {
    stroke: "black",
    roughness: 0,
    bowing: 0,
    strokeWidth: 1.75,
    maxRandomnessOffset: 0,
    disableMultiStroke: true,
    disableMultiStrokeFill: true,
  };

  const [dragOffset, setDragOffset] = useState<{
    dx: number;
    dy: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  function isNearLine(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    const a = py - y1;
    const b = x1 - px;
    const c = x1 * (y1 - py) + px * (py - y1);

    const distance =
      Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) /
      Math.hypot(y2 - y1, x2 - x1);

    return distance < 10;
  }

  function isInsideShape(x: number, y: number, shape: Shape): boolean {
    if (
      shape.type === "rectangle" ||
      shape.type === "ellipse" ||
      shape.type === "diamond"
    ) {
      return (
        x >= shape.x &&
        y >= shape.y &&
        x <= shape.x + shape.width! &&
        y <= shape.y + shape.height!
      );
    } else if (shape.type === "line" || shape.type === "arrow") {
      const minX = Math.min(shape.x, shape.x_2!);
      const maxX = Math.max(shape.x, shape.x_2!);
      const minY = Math.min(shape.y, shape.y_2!);
      const maxY = Math.max(shape.y, shape.y_2!);
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    } else if (shape.type === "text") {
      return (
        x >= shape.x &&
        y >= shape.y - 16 &&
        x <= shape.x + shape.text!.length * 10 &&
        y <= shape.y
      );
    }
    return false;
  }

  function drawResizeHandles(ctx: CanvasRenderingContext2D, shape: Shape) {
    const handleSize = 8;
    const corners = [
      [shape.x, shape.y],
      [shape.x + shape.width!, shape.y],
      [shape.x, shape.y + shape.height!],
      [shape.x + shape.width!, shape.y + shape.height!],
    ];

    ctx.fillStyle = "blue";
    corners.forEach(([x, y]) => {
      ctx.fillRect(
        x - handleSize / 2,
        y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
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

      if (activeTool === "selection") {
        const { x, y } = getMousePos(e);
        console.log("Inside MOuse down");
        for (let i = shapes.length - 1; i >= 0; i--) {
          const shape = shapes[i];
          if (isInsideShape(x, y, shape)) {
            setSelectedShapeId(shape.id);
            setDragOffset({ dx: x - shape.x, dy: y - shape.y });
            setIsDragging(true);
            console.log(shape);
            return;
          }
        }
        setSelectedShapeId(null);
        redrawCanvas();
        return;
      }

      if (activeTool === "eraser") {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (window.devicePixelRatio || 1);
        const y = (e.clientY - rect.top) * (window.devicePixelRatio || 1);

        const updatedShapes = shapes.filter((shape) => {
          if (
            shape.type === "rectangle" ||
            shape.type === "ellipse" ||
            shape.type === "diamond"
          ) {
            return !(
              x >= shape.x &&
              x <= shape.x + (shape.width ?? 0) &&
              y >= shape.y &&
              y <= shape.y + (shape.height ?? 0)
            );
          } else if (shape.type === "line" || shape.type === "arrow") {
            return !isNearLine(x, y, shape.x, shape.y, shape.x_2!, shape.y_2!);
          } else if (shape.type === "text") {
            return !(Math.abs(x - shape.x) < 50 && Math.abs(y - shape.y) < 20);
          }
          return true;
        });

        setShapes(updatedShapes);
        redrawCanvas();
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
      canvas.style.cursor = activeTool === "selection" ? "move" : "crosshair";

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
      } else if (
        activeTool === "selection" &&
        isDragging &&
        selectedShapeId &&
        dragOffset
      ) {
        const { x, y } = getMousePos(e);
        setShapes((prevShapes) =>
          prevShapes.map((shape) => {
            if (shape.id === selectedShapeId) {
              const dx = x - dragOffset.dx;
              const dy = y - dragOffset.dy;

              if (shape.type === "line" || shape.type === "arrow") {
                const x2Offset = shape.x_2! - shape.x;
                const y2Offset = shape.y_2! - shape.y;
                return {
                  ...shape,
                  x: dx,
                  y: dy,
                  x_2: dx + x2Offset,
                  y_2: dy + y2Offset,
                };
              }

              return {
                ...shape,
                x: dx,
                y: dy,
              };
            }
            return shape;
          })
        );
        return;
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
      } else if (activeTool === "selection" && isDragging) {
        setIsDragging(false);
        setDragOffset(null);
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
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === "Delete" || e.key === "Backspace") && selectedShapeId) {
      setShapes((prev) => prev.filter((shape) => shape.id !== selectedShapeId));
      setSelectedShapeId(null);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedShapeId]);

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

      if (shape.id === selectedShapeId) {
        ctx.save();
        ctx.strokeStyle = "lightblue";
        ctx.lineWidth = 5;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(
          shape.x / dpr,
          shape.y / dpr,
          shape.width! / dpr,
          shape.height! / dpr
        );
        ctx.restore();
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
