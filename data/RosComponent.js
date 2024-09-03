// 'use client'
import { useEffect, useState } from 'react';
const ROSLIB = require('roslib');

function RosComponent() {
    const [ros, setRos] = useState(null);
    const [connected, setConnected] = useState(false);
    const [pointCloudData1, setPointCloudData1] = useState(null);
    const [pointCloudData2, setPointCloudData2] = useState(null);
    const [pointCloudData3, setPointCloudData3] = useState(null);

    useEffect(() => {
        const rosInstance = new ROSLIB.Ros({
            url: 'ws://192.168.88.254:9090'
        });

        rosInstance.on('connection', () => {
            console.log('Connected to rosbridge WebSocket!');
            setConnected(true);
        });

        rosInstance.on('error', (error) => {
            console.error('Error connecting to rosbridge WebSocket: ', error);
        });

        rosInstance.on('close', () => {
            console.log('Connection to rosbridge WebSocket closed!');
            setConnected(false);
        });

        setRos(rosInstance);

        // Cleanup on component unmount
        return () => {
            if (rosInstance) {
                rosInstance.close();
            }
        };
    }, []);

    useEffect(() => {
        if (ros && connected) {
            console.log('Subscribing to topics...');
            
            // Define point cloud topics for each LiDAR
            const pointCloudTopic1 = new ROSLIB.Topic({
                ros: ros,
                name: '/velodyne1/pointcloud',
                messageType: 'sensor_msgs/PointCloud2'
            });

            const pointCloudTopic2 = new ROSLIB.Topic({
                ros: ros,
                name: '/velodyne2/pointcloud',
                messageType: 'sensor_msgs/PointCloud2'
            });

            const pointCloudTopic3 = new ROSLIB.Topic({
                ros: ros,
                name: '/velodyne3/pointcloud',
                messageType: 'sensor_msgs/PointCloud2'
            });

            // Subscribe to point cloud topics
            pointCloudTopic1.subscribe((message) => {
                console.log('Received data on /velodyne1/pointcloud');
                setPointCloudData1(message);
            });

            pointCloudTopic2.subscribe((message) => {
                console.log('Received data on /velodyne2/pointcloud');
                setPointCloudData2(message);
            });

            pointCloudTopic3.subscribe((message) => {
                console.log('Received data on /velodyne3/pointcloud');
                setPointCloudData3(message);
            });

            // Cleanup: Unsubscribe from topics on component unmount or connection loss
            return () => {
                console.log('Unsubscribing from topics...');
                pointCloudTopic1.unsubscribe();
                pointCloudTopic2.unsubscribe();
                pointCloudTopic3.unsubscribe();
            };
        }
    }, [ros, connected]);

    return { connected, pointCloudData1, pointCloudData2, pointCloudData3 };
}

export default RosComponent;
