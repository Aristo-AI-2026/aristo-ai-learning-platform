
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { AppView } from '../types';

const AssignmentCoverGenerator: React.FC = () => {
  const { setView, user } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Define initial default values to check against for auto-clearing
  const INITIAL_VALUES = {
    university: user?.institution || 'University Name',
    department: user?.department || 'Department Name',
    assignmentType: 'Assignment',
    courseNo: 'COURSE 101',
    courseName: 'Course Title Here',
    topic: 'Research Topic or Assignment Title',
    submissionDate: new Date().toLocaleDateString('en-GB'),
    teacherName: 'Teacher Name',
    teacherDesignation: 'Designation',
    teacherDept: 'Department Name',
    teacherUniv: 'University Name',
    studentName: 'SHUVO',
    studentRoll: '',
    studentReg: '',
    studentID: '24104006',
    studentMobile: '',
    studentBatch: '',
    studentSection: '',
    studentSession: '',
    additionalInfo: ''
  };

  const [formData, setFormData] = useState({ ...INITIAL_VALUES });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Generic focus handler to clear default text automatically when user starts typing
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // If the current value matches the initial placeholder value, clear it for the user
    if (value === (INITIAL_VALUES as any)[name]) {
      setFormData(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups to download the PDF.");
      return;
    }

    const studentFields = [
      { label: 'Name', value: formData.studentName },
      { label: 'Roll', value: formData.studentRoll },
      { label: 'Reg. No', value: formData.studentReg },
      { label: 'ID No', value: formData.studentID },
      { label: 'Mobile', value: formData.studentMobile },
      { label: 'Batch', value: formData.studentBatch },
      { label: 'Section', value: formData.studentSection },
      { label: 'Session', value: formData.studentSession },
    ].filter(f => f.value.trim() !== '');

    printWindow.document.write(`
      <html>
        <head>
          <title>Assignment Cover - ${formData.topic}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
            
            @page {
              size: A4;
              margin: 0mm; /* Removes browser headers and footers */
            }

            * { box-sizing: border-box; -webkit-print-color-adjust: exact; }

            body { 
              font-family: "Times New Roman", Times, serif; 
              padding: 0;
              margin: 0mm;
              color: black; 
              background: white;
              overflow: hidden;
            }

            .page-container {
              width: 210mm;
              height: 297mm;
              margin: 0 auto;
              /* 1 inch (25.4mm) top margin for logo and content */
              padding: 1in 20mm 15mm 20mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              position: relative;
            }

            .logo-wrapper {
              height: 140px;
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 15px;
            }

            .logo {
              max-height: 140px;
              max-width: 280px;
              object-fit: contain;
            }

            h1.univ {
              font-size: 28pt;
              font-weight: bold;
              margin: 0;
              text-align: center;
              line-height: 1.1;
              text-transform: uppercase;
              white-space: nowrap;
              width: 100%;
            }

            h2.dept {
              font-size: 34pt;
              font-weight: bold;
              margin: 10px 0 15px 0;
              text-align: center;
              line-height: 1.1;
            }

            h3.assignment-header {
              font-size: 26pt;
              font-weight: bold;
              text-decoration: underline;
              margin: 25px 0 20px 0;
              text-align: center;
              text-transform: uppercase;
            }

            .info-grid {
              width: 100%;
              max-width: 620px;
              margin-bottom: 10px;
              font-size: 14pt;
              font-weight: bold;
              margin-top: 10px;
            }

            .info-row {
              display: flex;
              margin-bottom: 10px;
              align-items: flex-start;
            }

            .info-label { width: 170px; flex-shrink: 0; }
            .info-colon { width: 35px; text-align: center; flex-shrink: 0; }
            .info-value { flex: 1; }

            .submission-boxes {
              display: flex;
              width: 100%;
              border: 1.5px solid black;
              min-height: 220px;
              /* Moved down by 0.5 inch (12.7mm) as requested */
              margin-top: 0.5in;
              margin-bottom: auto;
            }

            .box {
              flex: 1;
              padding: 22px;
              display: flex;
              flex-direction: column;
            }

            .box-left { border-right: 1.5px solid black; }

            .box-header {
              text-align: center;
              font-size: 15pt;
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 15px;
            }

            .box-content {
              font-size: 12.5pt;
              font-weight: bold;
              line-height: 1.5;
            }

            .student-info-row { display: flex; margin-bottom: 4px; }
            .student-label { width: 85px; flex-shrink: 0; }
            .student-colon { width: 15px; text-align: center; flex-shrink: 0; }
            .student-value { flex: 1; }

            @media print {
              body { background: none; }
              .page-container { margin: 0; border: none; }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="logo-wrapper">
              ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : `<div style="height: 140px;"></div>`}
            </div>
            
            <h1 class="univ">${formData.university}</h1>
            <h2 class="dept">${formData.department}</h2>
            
            <h3 class="assignment-header">${formData.assignmentType}</h3>
            
            <div class="info-grid">
              ${formData.courseNo ? `
              <div class="info-row">
                <div class="info-label">Course No</div>
                <div class="info-colon">:</div>
                <div class="info-value">${formData.courseNo}</div>
              </div>` : ''}
              ${formData.courseName ? `
              <div class="info-row">
                <div class="info-label">Course Name</div>
                <div class="info-colon">:</div>
                <div class="info-value">${formData.courseName}</div>
              </div>` : ''}
              ${formData.topic ? `
              <div class="info-row">
                <div class="info-label">Assignment Topic</div>
                <div class="info-colon">:</div>
                <div class="info-value">${formData.topic}</div>
              </div>` : ''}
              ${formData.submissionDate ? `
              <div class="info-row">
                <div class="info-label">Submission Date</div>
                <div class="info-colon">:</div>
                <div class="info-value">${formData.submissionDate}</div>
              </div>` : ''}
            </div>
            
            <div class="submission-boxes">
              <div class="box box-left">
                <div class="box-header">Submitted To:</div>
                <div class="box-content">
                  <p style="margin: 0;">${formData.teacherName}</p>
                  <p style="margin: 0;">${formData.teacherDesignation},</p>
                  <p style="margin: 0;">${formData.teacherDept},</p>
                  <p style="margin: 0;">${formData.teacherUniv}</p>
                </div>
              </div>
              <div class="box">
                <div class="box-header">Submitted By:</div>
                <div class="box-content">
                  ${studentFields.map(field => `
                    <div class="student-info-row">
                      <div class="student-label">${field.label}</div>
                      <div class="student-colon">:</div>
                      <div class="student-value">${field.value}</div>
                    </div>
                  `).join('')}
                  ${formData.additionalInfo ? `
                    <div class="student-info-row" style="margin-top: 8px; border-top: 1.2px dashed #000; padding-top: 5px;">
                      <div class="student-value">${formData.additionalInfo}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex items-center gap-4 mb-12">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setView(AppView.DASHBOARD)} 
          className="w-12 h-12 flex items-center justify-center glass rounded-xl hover:bg-white/10 transition-all text-blue-400 border-white/10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
        </motion.button>
        <div>
          <h1 className="text-3xl font-heading font-black mb-1 uppercase tracking-tighter text-white">Cover Page Generator</h1>
          <p className="text-slate-400 text-sm font-medium">Create a professional A4 assignment cover page instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Form Side */}
        <div className="glass p-8 rounded-[40px] border-white/5 space-y-6 bg-slate-900/40">
          
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[4px]">University Logo</h4>
            <div className="relative">
              <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleLogoUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-40 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 bg-white/5 ${logoUrl ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20'}`}
              >
                {logoUrl ? (
                  <img src={logoUrl} className="max-h-32 max-w-[85%] object-contain" alt="Uploaded" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Click to Upload University Logo</span>
                  </>
                )}
              </button>
              {logoUrl && (
                <button 
                  onClick={() => setLogoUrl(null)}
                  className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">University Name</label>
              <input type="text" name="university" value={formData.university} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department Name</label>
              <input type="text" name="department" value={formData.department} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Course No</label>
              <input type="text" name="courseNo" value={formData.courseNo} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Course Name</label>
              <input type="text" name="courseName" value={formData.courseName} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
            </div>
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assignment Topic</label>
              <input type="text" name="topic" value={formData.topic} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Submission Date</label>
              <input type="text" name="submissionDate" value={formData.submissionDate} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Main Heading</label>
              <input type="text" name="assignmentType" value={formData.assignmentType} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
            </div>
          </div>

          <div className="h-px bg-white/5 my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[4px] mb-2">Submitted To</h4>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teacher Name</label>
                <input type="text" name="teacherName" value={formData.teacherName} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Designation</label>
                <input type="text" name="teacherDesignation" value={formData.teacherDesignation} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label>
                <input type="text" name="teacherDept" value={formData.teacherDept} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">University</label>
                <input type="text" name="teacherUniv" value={formData.teacherUniv} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[4px] mb-2">Submitted By</h4>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Student Name</label>
                <input type="text" name="studentName" value={formData.studentName} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Roll Number</label>
                <input type="text" name="studentRoll" value={formData.studentRoll} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" placeholder="Hide if empty" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Registration No</label>
                <input type="text" name="studentReg" value={formData.studentReg} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" placeholder="Hide if empty" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ID Number</label>
                <input type="text" name="studentID" value={formData.studentID} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                <input type="text" name="studentMobile" value={formData.studentMobile} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" placeholder="Hide if empty" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Batch</label>
                <input type="text" name="studentBatch" value={formData.studentBatch} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" placeholder="Hide if empty" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Section</label>
                <input type="text" name="studentSection" value={formData.studentSection} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" placeholder="Hide if empty" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Session</label>
                <input type="text" name="studentSession" value={formData.studentSession} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none text-white font-medium" placeholder="Hide if empty" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Extra Information</label>
                <textarea name="additionalInfo" value={formData.additionalInfo} onFocus={handleInputFocus} onChange={handleInputChange} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/60 outline-none transition-all text-white min-h-[70px] resize-none" />
              </div>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportPDF}
            className="w-full py-5 bg-blue-600 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/20 hover:bg-blue-500 transition-all uppercase tracking-[6px] text-white flex items-center justify-center gap-4 mt-6"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export to A4 PDF
          </motion.button>
        </div>

        {/* Preview Side */}
        <div className="hidden lg:block sticky top-24">
           <div className="glass p-4 rounded-[40px] border-white/5 bg-white overflow-hidden shadow-2xl scale-[0.5] origin-top">
              <div className="bg-white text-black min-h-[1100px] flex flex-col items-center p-12 font-serif text-center" style={{ paddingTop: '1in' }}>
                 <div className="h-32 flex items-center justify-center mb-2 w-full">
                   {logoUrl ? (
                     <img src={logoUrl} className="max-h-32 max-w-[280px] object-contain" />
                   ) : (
                     <div className="h-32"></div>
                   )}
                 </div>
                 <h1 className="text-3xl font-bold mb-2 leading-tight uppercase tracking-tight whitespace-nowrap overflow-visible w-full">{formData.university}</h1>
                 <h2 className="text-[34pt] font-bold mb-4 leading-none">{formData.department}</h2>
                 
                 <h3 className="text-3xl font-bold underline mb-6 uppercase tracking-wide mt-6">{formData.assignmentType}</h3>
                 
                 <div className="w-full text-left space-y-3.5 mb-6 font-bold max-w-[580px] mx-auto text-lg mt-2">
                    {formData.courseNo && <div className="flex"><span className="w-44">Course No</span><span className="w-6">:</span><span>{formData.courseNo}</span></div>}
                    {formData.courseName && <div className="flex"><span className="w-44">Course Name</span><span className="w-6">:</span><span>{formData.courseName}</span></div>}
                    {formData.topic && <div className="flex"><span className="w-44">Assignment Topic</span><span className="w-6">:</span><span>{formData.topic}</span></div>}
                    {formData.submissionDate && <div className="flex"><span className="w-44">Submission Date</span><span className="w-6">:</span><span>{formData.submissionDate}</span></div>}
                 </div>

                 <div className="w-full border-[1.5px] border-black flex text-left font-bold min-h-[220px] mb-4" style={{ marginTop: '0.5in' }}>
                    <div className="flex-1 p-8 border-r-[1.5px] border-black">
                       <h4 className="text-center underline mb-6 text-xl">Submitted To:</h4>
                       <div className="space-y-1.5 text-base leading-snug">
                         <p>{formData.teacherName}</p>
                         <p>{formData.teacherDesignation},</p>
                         <p>{formData.teacherDept},</p>
                         <p>{formData.teacherUniv}</p>
                       </div>
                    </div>
                    <div className="flex-1 p-8">
                       <h4 className="text-center underline mb-6 text-xl">Submitted By:</h4>
                       <div className="space-y-1.5 text-base leading-tight">
                         {formData.studentName && <div className="flex"><span className="w-24">Name</span><span className="w-4">:</span><span>{formData.studentName}</span></div>}
                         {formData.studentRoll && <div className="flex"><span className="w-24">Roll</span><span className="w-4">:</span><span>{formData.studentRoll}</span></div>}
                         {formData.studentReg && <div className="flex"><span className="w-24">Reg. No</span><span className="w-4">:</span><span>{formData.studentReg}</span></div>}
                         {formData.studentID && <div className="flex"><span className="w-24">ID No</span><span className="w-4">:</span><span>{formData.studentID}</span></div>}
                         {formData.studentMobile && <div className="flex"><span className="w-24">Mobile</span><span className="w-4">:</span><span>{formData.studentMobile}</span></div>}
                         {formData.studentBatch && <div className="flex"><span className="w-24">Batch</span><span className="w-4">:</span><span>{formData.studentBatch}</span></div>}
                         {formData.studentSection && <div className="flex"><span className="w-24">Section</span><span className="w-4">:</span><span>{formData.studentSection}</span></div>}
                         {formData.studentSession && <div className="flex"><span className="w-24">Session</span><span className="w-4">:</span><span>{formData.studentSession}</span></div>}
                         
                         {formData.additionalInfo && (
                           <div className="mt-4 pt-3 border-t-[1.2px] border-slate-300 text-sm font-medium italic text-slate-700 leading-snug">{formData.additionalInfo}</div>
                         )}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
           <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4">One-Page A4 Precision Preview</p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCoverGenerator;
