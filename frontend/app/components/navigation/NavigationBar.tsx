import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";

const buttonStyle = {
    padding: "8px 16px",
    height: "85px",
    width: "85px",
    cursor: "pointer",
    borderRadius: "50px",
    border: "white",
    background: "rgb(184, 217, 183)",
    color: "white",
    fontWeight: 500,
    position: "absolute" as "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}

/* To make a draggable button */
interface Position {
    x: number;
    y: number;
}

/* Implement the draggeable button */
const DraggableButton: React.FC = () => {
    const [position, setPosition] = useState<Position>({x: 100, y: 100});
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState<Position>({x: 0, y: 0});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - offset.x,
                y: e.clientY - offset.y,
            });
        }
    };

    const toggleDropdown = () => {
        setIsDropdownOpen((lastState) => !lastState);
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    });

    return (
        <div style={{position: "relative"}}>
            <div style={{
                ...buttonStyle,
                left: position.x,
                top: position.y
            }}
                onMouseDown={handleMouseDown}
                onClick={toggleDropdown}>
                    Menu
                </div>
        </div>
    )
}

export default DraggableButton;

