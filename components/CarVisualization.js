"use client";  // This line tells Next.js that the component is client-side only

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

// Dynamically import ROSLIB for client-side rendering
const ROSLIB = dynamic(() => import('roslib'), { ssr: false });

function CarVisualization({ pointCloudData1, pointCloudData2, pointCloudData3 }) {
    const mountRef = useRef(null);

    // Store separate geometries for each point cloud
    const pointGeometry1 = useRef(new THREE.BufferGeometry()).current;
    const pointGeometry2 = useRef(new THREE.BufferGeometry()).current;
    const pointGeometry3 = useRef(new THREE.BufferGeometry()).current;

    // Utility function to convert base64 to ArrayBuffer
    function base64ToArrayBuffer(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Process incoming point cloud messages and update geometries
    const processMessage = (cloud, pointGeometry) => {
        let vertices = [];
        let colors = [];
        const buffer = base64ToArrayBuffer(cloud.data);
        const color = new THREE.Color();

        for (let i = 0; i <= buffer.byteLength - cloud.point_step; i += cloud.point_step) {
            const data = new DataView(buffer);
            vertices.push(
                data.getFloat32(i, true),
                data.getFloat32(i + 8, true),
                data.getFloat32(i + 4, true)
            );
            color.setHSL(i / buffer.byteLength, 1, 0.5);
            colors.push(color.r, color.g, color.b);
        }

        pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        pointGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        pointGeometry.attributes.position.needsUpdate = true;  // Ensure the geometry updates
        pointGeometry.attributes.color.needsUpdate = true;
    };

    useEffect(() => {
        // Ensure the code runs only on the client-side
        if (typeof window !== "undefined") {
            const scene = new THREE.Scene();
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            mountRef.current.appendChild(renderer.domElement);

            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;

            const camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 1000);
            camera.position.z = -4;
            camera.position.y = Math.tan((35 * Math.PI) / 180) * Math.abs(camera.position.z);
            camera.lookAt(0, 0, 1);
            renderer.setSize(width, height);

            // Add lighting and grid
            const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
            directionalLight.position.set(-1, 5, 0);
            scene.add(directionalLight);
            const gridHelper = new THREE.GridHelper(3, 4);
            scene.add(gridHelper);

            // Load and add car model
            const objLoader = new OBJLoader();
            objLoader.load('/models/Car_Base_FR_Layout_Sups_low_poly.objFB285956-E578-486A-830C-770E083C1090.obj', (object) => {
                object.scale.set(1, 1, 0.8);
                object.position.set(0, 0, 0);
                scene.add(object);
            });

            // Create materials for each point cloud
            const pointMaterial1 = new THREE.PointsMaterial({ size: 0.01, vertexColors: true });
            const pointCloud1 = new THREE.Points(pointGeometry1, pointMaterial1);
            scene.add(pointCloud1);

            const pointMaterial2 = new THREE.PointsMaterial({ size: 0.01, vertexColors: true });
            const pointCloud2 = new THREE.Points(pointGeometry2, pointMaterial2);
            scene.add(pointCloud2);

            const pointMaterial3 = new THREE.PointsMaterial({ size: 0.01, vertexColors: true });
            const pointCloud3 = new THREE.Points(pointGeometry3, pointMaterial3);
            scene.add(pointCloud3);

            const animate = () => {
                requestAnimationFrame(animate);
                renderer.render(scene, camera);
            };

            const handleResize = () => {
                const width = mountRef.current.clientWidth;
                const height = mountRef.current.clientHeight;
                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            };

            window.addEventListener('resize', handleResize);
            animate();

            return () => {
                window.removeEventListener('resize', handleResize);
                renderer.dispose();
            };
        }
    }, []);  // Only run once, on mount

    useEffect(() => {
        if (pointCloudData1 && pointCloudData1.data) {
            processMessage(pointCloudData1, pointGeometry1);
        }
        if (pointCloudData2 && pointCloudData2.data) {
            processMessage(pointCloudData2, pointGeometry2);
        }
        if (pointCloudData3 && pointCloudData3.data) {
            processMessage(pointCloudData3, pointGeometry3);
        }
    }, [pointCloudData1, pointCloudData2, pointCloudData3]);  // Re-run when point cloud data changes

    return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}

export default CarVisualization;
