import { KulpElement, html, css, register, prop } from "kulp-kit";
import { _ } from "kulp-kit";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

@register("voice-recorder.voice-recorder-plugin")
export class VoiceRecorder extends KulpElement {
  @prop({ type: String }) audioFormat = "audio/webm"; 
  @prop({ type: Number }) maxDuration = 60; 
  @prop({ type: Boolean }) enableTimer = false; 
  @prop({ type: Boolean }) showAudioPlayer = false; 
  @prop({ type: Boolean }) disableRecording = false; 
  @prop({ type: Boolean }) recordingIndicator = false; 
  @prop({ type: Boolean }) autoPlayAfterRecord = false; 
  @prop({ type: Boolean }) saveToLocalStorage = false; 
  @prop({ type: String }) recordingText = "..."; 
  @prop({ type: String }) idleText = "🎙️"; 
  @prop({ type: String }) audioPlayerPosition = "bottom"; 
  @prop({ type: String }) outputVariable = "";
  @prop({ type: String }) buttonColorMode = "primary";  
  @prop({ type: String }) recordingButtonColorMode = "accent";  

  @prop({ type: Boolean }) saveToAWS = false; // New property for enabling/disabling direct upload
  @prop({ type: String }) s3AccessKey = "";
  @prop({ type: String }) s3SecretKey = "";
  @prop({ type: String }) s3BucketName = "";
  @prop({ type: String }) s3Region = "ap-south-1";

  @prop({ type: String }) apiBaseUrl = "http://localhost:8000"; 
  @prop({ type: String }) authToken = "8b7cf227c62bfea73ca6ceb622ffdaf9ce6f790e"; // ✅ Dynamic Auth Token
  @prop({ type: String }) fileNamingFormat = "recording-{timestamp}.webm"; // ✅ Custom File Naming Format

  @prop({ type: String }) type: "message" | "notice" | undefined;
  @prop({ type: Number }) messageId = "";  // ✅ Add Message ID
  @prop({ type: Number }) noticeId = "";   // ✅ Add Notice ID
  @prop({ type: String }) messageParentId = ""; // ✅ Fixed Type
  @prop({ type: String }) noticeParentId = "";  // ✅ Fixed Type
  @prop({ type: String }) receiverId = "";  // ✅ Fixed Type
  @prop({ type: Number }) refresh_id = 0;

  

  

  isRecording = false;
  audioURL = "";
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: BlobPart[] = [];
  stream: MediaStream | null = null;
  showPopup = false;

  static styles = css`
    .recorder-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
    }
    .record-button {
      padding: 10px 10px;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      font-size: 16px;
      color: white;
      user-select: none;
      transition: background-color 0.3s ease-in-out;
    }
      
    .popup-audio-player {
      min-width: 260px;
      position: fixed;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.85);
      padding: 12px;
      border-radius: 8px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 4px 12px rgba(75, 75, 75, 0.3);
      min-width: 82vw;
    }
    .popup-close {
      position: absolute;
      top: 5px;
      right: 5px;
      height: 20px;
      width: 20px;
      background: rgba(255, 255, 255, 0.8);
      border: none;
      color: black;
      font-size: 10px;
      cursor: pointer;
      border-radius: 50%;
      z-index: 1001;
      transition: opacity 0.2s ease-in-out;
    }
    .popup-close:hover {
      opacity: 0.6;
      background: white;
    }
  `;

  /** ✅ Function to Get Color Variable or Direct Color */
  getColorValue(colorMode: string) {
    const themeColors = ["primary", "secondary", "tertiary", "accent", "highlight", "text", "background"];
    
    return themeColors.includes(colorMode) 
      ? `var(--color-${colorMode}, rgba(228, 228, 228, 0.85))`  // Use Theme Color
      : colorMode; // Direct Color (red, blue, yellow, etc.)
  }
  

 /** ✅ Upload Recording to AWS S3 and Link to Django */
 async uploadToS3(
  audioBlob: Blob,
  _messageId?: string,
  _noticeId?: string,
  _type?: "message" | "notice",
  _messageParentId?: string,
  _noticeParentId?: string,
  classroomId?: string
) {
  if (!this.s3AccessKey || !this.s3SecretKey || !this.s3BucketName) {
    return;
  }

  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const s3 = new S3Client({
      region: this.s3Region,
      credentials: {
        accessKeyId: this.s3AccessKey,
        secretAccessKey: this.s3SecretKey,
      },
    });

    const fileName = this.fileNamingFormat.replace("{timestamp}", Date.now().toString());

    const uploadParams = {
      Bucket: this.s3BucketName,
      Key: fileName,
      Body: uint8Array,
      ContentType: "audio/webm",
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const s3URL = `https://${this.s3BucketName}.s3.${this.s3Region}.amazonaws.com/${fileName}`;

    const apiEndpoint = `${this.apiBaseUrl}/base/auto-api/communication/voice/`;
    
    let payload: Record<string, any> = {
      voice_link: s3URL,
      type: this.type || (this.messageId ? "message" : this.noticeId ? "notice" : undefined),
      message: this.messageId || undefined,
      parent_message: this.messageParentId || undefined,
      receiver: this.receiverId || undefined,
      notice: this.noticeId || undefined,
      parent_notice: this.noticeParentId || undefined,
      classroom: classroomId || undefined,
    };

    if (!this.authToken) {
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Token ${this.authToken}`,
    };

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
    } else {
    }
  } catch (error) {
  }
}



async startRecording() {
  if (this.disableRecording) return;
  try {
    let mimeType = this.audioFormat;
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "audio/webm";
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.audioChunks = [];
    this.isRecording = true;
    this.showPopup = false;
    this.requestUpdate();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.audioChunks.push(event.data);
    };

    this.mediaRecorder.onstop = async () => {
      if (this.audioChunks.length) {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        this.audioURL = URL.createObjectURL(audioBlob);

        if (this.saveToLocalStorage) {
          localStorage.setItem("lastRecording", JSON.stringify(await audioBlob.arrayBuffer()));
        }

        this.showPopup = true;
        this.requestUpdate();

        if (this.autoPlayAfterRecord) {
          const audio = new Audio(this.audioURL);
          audio.play();
        }

        // ✅ Ensure correct type and IDs are set explicitly
        let finalType: "message" | "notice" | undefined = this.type;
        if (!finalType) {
          finalType = this.messageId ? "message" : this.noticeId ? "notice" : undefined;
        }

        // ✅ Upload to S3 with ALL IDs explicitly sent
        if (this.saveToAWS) {
          await this.uploadToS3(
            audioBlob,
            this.messageId || undefined,
            this.noticeId || undefined,
            finalType,
            this.messageParentId || undefined,
            this.noticeParentId || undefined,
          );
        }
      }
    };

    this.mediaRecorder.start();
  } catch (error) {
  }
}

dispatchRefreshIdUpdated() {
  window.dispatchEvent(new CustomEvent("refresh_id_updated", { detail: { refresh_id: this.refresh_id }}));
}


  
stopRecording() {
  if (this.mediaRecorder && this.isRecording) {
    this.mediaRecorder.stop();
    this.isRecording = false;

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.refresh_id = Date.now(); // ✅ Set a new unique Refresh ID
    this.requestUpdate();  // ✅ Force UI update
  }
}


  closePopup() {
    this.showPopup = false;
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="recorder-container">
        <button 
          class="record-button ${this.isRecording ? 'recording' : ''}" 
          @pointerdown="${this.startRecording}" 
          @pointerup="${this.stopRecording}" 
          ?disabled=${this.disableRecording}
          style="background-color: ${this.isRecording ? this.getColorValue(this.recordingButtonColorMode) : this.getColorValue(this.buttonColorMode)};">
          <span style="user-select: none;">${this.isRecording ? this.recordingText : this.idleText}</span>
        </button>
  
        <script>
          window.dispatchEvent(new CustomEvent("refresh_id_updated", { detail: { refresh_id: ${this.refresh_id} }}));
        </script>
  
        ${this.showAudioPlayer && this.audioURL && this.showPopup ? html`
          <div class="popup-audio-player">
            <button class="popup-close" @click="${this.closePopup}">✖</button>
            <audio class="audio-player" controls src="${this.audioURL}"></audio>
          </div>` : ""}
      </div>
    `;
  }
  
}
