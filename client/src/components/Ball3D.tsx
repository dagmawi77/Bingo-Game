import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

type Props = {
	number?: number | null
}

export function Ball3D({ number }: Props): JSX.Element {
	const mountRef = useRef<HTMLDivElement>(null)
	const textRef = useRef<THREE.Sprite | null>(null)

	useEffect(() => {
		if (!mountRef.current) return
		const mount = mountRef.current

		const scene = new THREE.Scene()
		const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
		camera.position.z = 5

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
		renderer.setSize(120, 120)
		mount.appendChild(renderer.domElement)

		const light = new THREE.DirectionalLight(0xffffff, 1)
		light.position.set(3, 3, 5)
		scene.add(light)
		scene.add(new THREE.AmbientLight(0xffffff, 0.4))

		const geometry = new THREE.SphereGeometry(1, 32, 32)
		const material = new THREE.MeshPhongMaterial({ color: 0xfff7e6, shininess: 80 })
		const sphere = new THREE.Mesh(geometry, material)
		scene.add(sphere)

		// Text sprite for number
		const canvas = document.createElement('canvas')
		canvas.width = 256; canvas.height = 256
		const ctx = canvas.getContext('2d')!
		const drawText = (val: number | null | undefined) => {
			ctx.clearRect(0,0,256,256)
			ctx.fillStyle = '#111827'
			ctx.beginPath()
			ctx.arc(128, 128, 120, 0, Math.PI*2)
			ctx.fillStyle = '#ffffff'
			ctx.fill()
			ctx.fillStyle = '#111827'
			ctx.font = 'bold 120px Inter, Arial, sans-serif'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.fillText(val ? String(val) : '', 128, 140)
		}
		drawText(number ?? null)
		const texture = new THREE.CanvasTexture(canvas)
		const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true })
		const sprite = new THREE.Sprite(spriteMat)
		sprite.scale.set(2, 2, 1)
		scene.add(sprite)
		textRef.current = sprite

		let animId = 0
		const animate = () => {
			animId = requestAnimationFrame(animate)
			sphere.rotation.y += 0.02
			renderer.render(scene, camera)
		}
		animate()

		return () => {
			cancelAnimationFrame(animId)
			renderer.dispose()
			mount.removeChild(renderer.domElement)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		// update text texture
		const sprite = textRef.current
		if (!sprite) return
		const map = sprite.material as THREE.SpriteMaterial
		const canvas = (map.map as THREE.CanvasTexture).image as HTMLCanvasElement
		const ctx = canvas.getContext('2d')!
		ctx.clearRect(0,0,256,256)
		ctx.fillStyle = '#ffffff'
		ctx.beginPath(); ctx.arc(128,128,120,0,Math.PI*2); ctx.fill()
		ctx.fillStyle = '#111827'
		ctx.font = 'bold 120px Inter, Arial, sans-serif'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillText(number ? String(number) : '', 128, 140)
		;(map.map as THREE.CanvasTexture).needsUpdate = true
	}, [number])

	return <div ref={mountRef} />
}


