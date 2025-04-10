"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accessibility } from "lucide-react"

export function AccessibilityMenu() {
  const [fontSize, setFontSize] = useState(100)
  const [contrast, setContrast] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [dyslexicFont, setDyslexicFont] = useState(false)

  // Apply accessibility settings
  const applySettings = () => {
    // Font size
    document.documentElement.style.fontSize = `${fontSize}%`

    // High contrast
    if (contrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }

    // Reduce motion
    if (reduceMotion) {
      document.documentElement.classList.add("reduce-motion")
    } else {
      document.documentElement.classList.remove("reduce-motion")
    }

    // Dyslexic font
    if (dyslexicFont) {
      document.documentElement.classList.add("dyslexic-font")
    } else {
      document.documentElement.classList.remove("dyslexic-font")
    }

    // Save settings
    localStorage.setItem(
      "accessibility-settings",
      JSON.stringify({
        fontSize,
        contrast,
        reduceMotion,
        dyslexicFont,
      }),
    )
  }

  // Load settings on mount
  useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem("accessibility-settings") || "{}")
      if (settings.fontSize) setFontSize(settings.fontSize)
      if (settings.contrast !== undefined) setContrast(settings.contrast)
      if (settings.reduceMotion !== undefined) setReduceMotion(settings.reduceMotion)
      if (settings.dyslexicFont !== undefined) setDyslexicFont(settings.dyslexicFont)

      applySettings()
    } catch (e) {
      console.error("Failed to load accessibility settings", e)
    }
  }, [])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 z-50 rounded-full"
          aria-label="Accessibility options"
        >
          <Accessibility className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Accessibility Options</DialogTitle>
          <DialogDescription>Customize the website to meet your accessibility needs.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="motion">Motion</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-size">Font Size ({fontSize}%)</Label>
              </div>
              <Slider
                id="font-size"
                min={75}
                max={200}
                step={5}
                value={[fontSize]}
                onValueChange={(value) => {
                  setFontSize(value[0])
                  document.documentElement.style.fontSize = `${value[0]}%`
                }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="dyslexic-font"
                checked={dyslexicFont}
                onCheckedChange={(checked) => {
                  setDyslexicFont(checked)
                  if (checked) {
                    document.documentElement.classList.add("dyslexic-font")
                  } else {
                    document.documentElement.classList.remove("dyslexic-font")
                  }
                }}
              />
              <Label htmlFor="dyslexic-font">Use Dyslexia-friendly Font</Label>
            </div>
          </TabsContent>

          <TabsContent value="visual" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="high-contrast"
                checked={contrast}
                onCheckedChange={(checked) => {
                  setContrast(checked)
                  if (checked) {
                    document.documentElement.classList.add("high-contrast")
                  } else {
                    document.documentElement.classList.remove("high-contrast")
                  }
                }}
              />
              <Label htmlFor="high-contrast">High Contrast Mode</Label>
            </div>
          </TabsContent>

          <TabsContent value="motion" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="reduce-motion"
                checked={reduceMotion}
                onCheckedChange={(checked) => {
                  setReduceMotion(checked)
                  if (checked) {
                    document.documentElement.classList.add("reduce-motion")
                  } else {
                    document.documentElement.classList.remove("reduce-motion")
                  }
                }}
              />
              <Label htmlFor="reduce-motion">Reduce Motion</Label>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={applySettings}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
