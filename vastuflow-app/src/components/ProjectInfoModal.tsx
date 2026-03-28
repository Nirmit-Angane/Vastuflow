"use client";

import React, { useState } from "react";
import { ProjectState } from "@/state/project-state";

interface ProjectInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (info: ProjectState["projectInfo"]) => void;
    currentInfo: ProjectState["projectInfo"];
}

export default function ProjectInfoModal({ isOpen, onClose, onSave, currentInfo }: ProjectInfoModalProps) {
    const [info, setInfo] = useState<ProjectState["projectInfo"]>(currentInfo);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(info);
        onClose();
    };

    return (
        <div className="project-modal-backdrop">
            <div className="project-modal-content">
                <div className="project-modal-header">
                    <h2>Project Details</h2>
                    <p>Enter information for the PDF report cover and footer.</p>
                </div>

                <div className="project-modal-body">
                    <div className="input-group">
                        <label>Prepared For (Client Name)</label>
                        <input
                            type="text"
                            placeholder="e.g. Sharma Family"
                            value={info.clientName}
                            onChange={(e) => setInfo({ ...info, clientName: e.target.value })}
                        />
                    </div>

                    <div className="input-row">
                        <div className="input-group">
                            <label>Property Type</label>
                            <select
                                value={info.propertyType}
                                onChange={(e) => setInfo({ ...info, propertyType: e.target.value })}
                            >
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Industrial">Industrial</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Prepared By (Consultant)</label>
                            <input
                                type="text"
                                placeholder="Consultant Name"
                                value={info.consultantName}
                                onChange={(e) => setInfo({ ...info, consultantName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Address / Location</label>
                        <input
                            type="text"
                            placeholder="e.g. Mumbai, Maharashtra"
                            value={info.address}
                            onChange={(e) => setInfo({ ...info, address: e.target.value })}
                        />
                    </div>
                </div>

                <div className="project-modal-footer">
                    <button className="btn-skip" onClick={onClose}>
                        Skip
                    </button>
                    <button className="btn-continue" onClick={handleSave}>
                        Continue
                    </button>
                </div>
            </div>

            <style jsx>{`
                .project-modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease;
                }

                .project-modal-content {
                    background: rgba(28, 26, 21, 0.95);
                    border: 1px solid rgba(184, 146, 58, 0.3);
                    border-radius: 16px;
                    width: 90%;
                    max-width: 500px;
                    padding: 32px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(184, 146, 58, 0.1);
                    color: #fff;
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .project-modal-header h2 {
                    font-family: var(--font-outfit), sans-serif;
                    color: var(--accent-gold);
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    letter-spacing: 1px;
                }

                .project-modal-header p {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 14px;
                    margin-bottom: 24px;
                }

                .project-modal-body {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .input-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .input-group label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--accent-gold);
                    font-weight: 700;
                    opacity: 0.8;
                }

                .input-group input, .input-group select {
                    background: var(--surface-2);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 12px;
                    color: var(--text-primary);
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .input-group select option {
                    background-color: #121212;
                    color: #ffffff;
                }

                .input-group input:focus, .input-group select:focus {
                    outline: none;
                    border-color: var(--accent-gold);
                    background: var(--surface-3, rgba(255, 255, 255, 0.08));
                }

                .input-group input::placeholder {
                    color: var(--text-tertiary);
                }

                .project-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 32px;
                }

                .btn-skip {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.6);
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .btn-skip:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                }

                .btn-continue {
                    background: var(--accent-gold);
                    border: none;
                    color: #1c1a15;
                    padding: 10px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .btn-continue:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(184, 146, 58, 0.3);
                    filter: brightness(1.1);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
