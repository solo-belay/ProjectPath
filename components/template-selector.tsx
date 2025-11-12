"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface PresentationTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  preview: string
}

const PRESENTATION_TEMPLATES: PresentationTemplate[] = [
  {
    id: "road",
    name: "Curved Road",
    category: "Timeline",
    description: "Winding path visualization with phases flowing along a curved road",
    icon: "🛣️",
    preview: "Text positioned directly on an elegant curved path",
  },
  {
    id: "slide",
    name: "Presentation Slides",
    category: "Slide-based",
    description: "Professional slide layout showing multiple phases per slide",
    icon: "📊",
    preview: "Clean grid layout with quarters and key information",
  },
  {
    id: "circular",
    name: "Circular Flow",
    category: "Circular",
    description: "360-degree phase arrangement in a circular pattern",
    icon: "⭕",
    preview: "Phases arranged radially around center",
  },
  {
    id: "timeline",
    name: "Vertical Timeline",
    category: "Timeline",
    description: "Linear vertical progression of phases with connectors",
    icon: "⏳",
    preview: "Stacked phases with vertical lines connecting them",
  },
  {
    id: "kanban",
    name: "Kanban Board",
    category: "Board-based",
    description: "Column-based layout for organizing phases by status",
    icon: "📋",
    preview: "Multiple columns showing phases and progress",
  },
  {
    id: "gantt",
    name: "Gantt Chart",
    category: "Timeline",
    description: "Time-based bar chart showing phase duration and dependencies",
    icon: "📈",
    preview: "Horizontal bars representing phase timelines",
  },
  {
    id: "network",
    name: "Network Graph",
    category: "Graph",
    description: "Node-based network showing phase connections and dependencies",
    icon: "🕸️",
    preview: "Interactive nodes with connecting lines",
  },
  {
    id: "grid",
    name: "Grid Layout",
    category: "Grid",
    description: "Simple organized grid display of all phases",
    icon: "⊞",
    preview: "Clean grid with equal-sized phase cards",
  },
  {
    id: "spiral",
    name: "Spiral Growth",
    category: "Circular",
    description: "Spiral visualization showing growth progression",
    icon: "🌀",
    preview: "Phases spiraling outward showing growth",
  },
  {
    id: "funnel",
    name: "Funnel View",
    category: "Funnel",
    description: "Inverted funnel showing phases with narrowing scope",
    icon: "📣",
    preview: "Phases as funnel stages narrowing down",
  },
  {
    id: "tree",
    name: "Tree Hierarchy",
    category: "Hierarchy",
    description: "Tree-structured hierarchy of phases and sub-phases",
    icon: "🌳",
    preview: "Branching tree structure of phases",
  },
  {
    id: "wave",
    name: "Wave Timeline",
    category: "Timeline",
    description: "Undulating wave pattern showing phase progression",
    icon: "〰️",
    preview: "Phases arranged in a smooth wave pattern",
  },
  {
    id: "milestone",
    name: "Milestone Markers",
    category: "Timeline",
    description: "Horizontal line with milestone markers for each phase",
    icon: "📍",
    preview: "Linear path with prominent milestone points",
  },
  {
    id: "hexagon",
    name: "Hexagon Grid",
    category: "Grid",
    description: "Honeycomb hexagonal grid layout",
    icon: "🔷",
    preview: "Hexagonal cells arranged in honeycomb pattern",
  },
  {
    id: "staircase",
    name: "Staircase Steps",
    category: "Progressive",
    description: "Ascending staircase showing step-by-step progression",
    icon: "🪜",
    preview: "Phases as ascending steps or levels",
  },
  {
    id: "orbit",
    name: "Orbital Paths",
    category: "Circular",
    description: "Phases orbiting around central concept",
    icon: "🪐",
    preview: "Phases in orbital paths around center",
  },
  {
    id: "ribbon",
    name: "Ribbon Flow",
    category: "Flow",
    description: "Ribbon-like flowing pattern connecting phases",
    icon: "🎀",
    preview: "Smooth ribbon flowing through phases",
  },
  {
    id: "bracket",
    name: "Bracket System",
    category: "Hierarchy",
    description: "Bracket notation showing nested phase relationships",
    icon: "⟨⟩",
    preview: "Phases organized in bracket hierarchies",
  },
  {
    id: "pyramid",
    name: "Pyramid Stack",
    category: "Hierarchy",
    description: "Pyramid structure showing phase hierarchy and importance",
    icon: "🔺",
    preview: "Phases stacked in pyramid formation",
  },
  {
    id: "radial",
    name: "Radial Burst",
    category: "Radial",
    description: "Burst pattern radiating from central phase",
    icon: "✦",
    preview: "Phases radiating outward from center",
  },
]

export function TemplateSelector({
  onSelectTemplate,
}: {
  onSelectTemplate: (templateId: string, templateName: string) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const categories = ["All", ...new Set(PRESENTATION_TEMPLATES.map((t) => t.category))]
  const filteredTemplates =
    selectedCategory === "All"
      ? PRESENTATION_TEMPLATES
      : PRESENTATION_TEMPLATES.filter((t) => t.category === selectedCategory)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-balance">Choose Your Presentation Style</h1>
        <p className="text-xl text-muted-foreground text-balance">
          Select how you want to visualize and present your roadmap
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredTemplates.map((template, idx) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSelectTemplate(template.id, template.name)}
            className="group cursor-pointer bg-card/30 border border-border/50 rounded-lg p-6 hover:border-primary/50 hover:bg-card/50 transition-all hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="text-4xl mb-3">{template.icon}</div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{template.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
            <p className="text-xs text-accent bg-accent/10 rounded px-2 py-1 inline-block mb-3">{template.preview}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">{template.category}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <Button onClick={() => onSelectTemplate("custom", "Custom")} variant="outline" size="lg" className="gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Custom Style
        </Button>
      </div>
    </motion.div>
  )
}
