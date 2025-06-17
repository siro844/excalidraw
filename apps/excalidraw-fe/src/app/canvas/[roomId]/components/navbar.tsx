"use client"

import type React from "react"
import { useState } from "react"
import {
  MousePointer2,
  Square,
  Circle,
  Diamond,
  Minus,
  ArrowRight,
  Pencil,
  Type,
  ImageIcon,
  Eraser,
  Hand,
} from "lucide-react"



interface ToolButtonProps {
  tool: Tool
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
  title: string
}

function ToolButton({ tool, icon, isActive, onClick, title }: ToolButtonProps) {
  return (
    <button
      className={`
        relative w-10 h-10 flex items-center justify-center rounded-md transition-all duration-150 ease-in-out
        ${isActive ? "bg-blue-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"}
      `}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {icon}
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-600" />
      )}
    </button>
  )
}
interface ExcalidrawNavbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

export default function ExcalidrawNavbar(props:ExcalidrawNavbarProps) {

  const tools: Array<{ tool: Tool; icon: React.ReactNode; title: string }> = [
    {
      tool: "selection",
      icon: <MousePointer2 size={16} strokeWidth={1.5} />,
      title: "Selection — V",
    },
    {
      tool: "rectangle",
      icon: <Square size={16} strokeWidth={1.5} />,
      title: "Rectangle — R",
    },
    {
      tool: "diamond",
      icon: <Diamond size={16} strokeWidth={1.5} />,
      title: "Diamond — D",
    },
    {
      tool: "ellipse",
      icon: <Circle size={16} strokeWidth={1.5} />,
      title: "Ellipse — O",
    },
    {
      tool: "arrow",
      icon: <ArrowRight size={16} strokeWidth={1.5} />,
      title: "Arrow — A",
    },
    {
      tool: "line",
      icon: <Minus size={16} strokeWidth={1.5} />,
      title: "Line — L",
    },
    {
      tool: "freedraw",
      icon: <Pencil size={16} strokeWidth={1.5} />,
      title: "Draw — P",
    },
    {
      tool: "text",
      icon: <Type size={16} strokeWidth={1.5} />,
      title: "Text — T",
    },
    {
      tool: "image",
      icon: <ImageIcon size={16} strokeWidth={1.5} />,
      title: "Image",
    },
    {
      tool: "eraser",
      icon: <Eraser size={16} strokeWidth={1.5} />,
      title: "Eraser — E",
    },
    {
      tool: "hand",
      icon: <Hand size={16} strokeWidth={1.5} />,
      title: "Hand — H",
    },
  ]

  const handleToolSelect = (tool: Tool) => {
    props.onToolChange(tool)
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="grid grid-cols-2 gap-1">
          {tools.map(({ tool, icon, title }) => (
            <ToolButton
              key={tool}
              tool={tool}
              icon={icon}
              title={title}
              isActive={props.activeTool === tool}
              onClick={() => handleToolSelect(tool)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
