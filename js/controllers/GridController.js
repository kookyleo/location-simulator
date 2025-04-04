/**
 * GridController 类 - 负责管理六边形网格配置
 */
class GridController {
  constructor(hexagonGridLayer) {
    this.hexagonGridLayer = hexagonGridLayer;
    this.grids = [];
    this.loadGridsFromLocalStorage();
    
    // 初始化UI元素
    this.manageGridsBtn = document.getElementById('manageGrids');
    
    // 绑定事件处理器
    this._setupEventListeners();
    
    // 设置ESC键关闭功能
    this._setupEscKeyListener();
  }
  
  /**
   * 设置事件监听器
   * @private
   */
  _setupEventListeners() {
    // 管理网格按钮
    this.manageGridsBtn.addEventListener('click', () => this.openGridManager());
    
    // 关闭网格管理器
    const closeBtn = document.getElementById('closeGridsManageModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeGridManager());
    }
    
    // 添加新网格
    const addBtn = document.getElementById('addNewGrid');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.createNewGrid());
    }
    
    // 导入网格按钮
    const importBtn = document.getElementById('importGridsButton');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importGrids());
    }
    
    // 导出网格按钮
    const exportBtn = document.getElementById('exportGridsButton');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportGrids());
    }
  }
  
  /**
   * 从localStorage加载网格配置
   */
  loadGridsFromLocalStorage() {
    try {
      const savedGrids = localStorage.getItem('hexagonGrids');
      if (savedGrids) {
        this.grids = JSON.parse(savedGrids);
        // 加载后立即更新网格显示
        this.updateGridDisplay();
      }
    } catch (error) {
      console.error('Failed to load grid configuration:', error);
      this.grids = [];
    }
  }
  
  /**
   * 保存网格配置到localStorage
   */
  saveGridsToLocalStorage() {
    try {
      localStorage.setItem('hexagonGrids', JSON.stringify(this.grids));
      // 触发网格更新
      this.updateGridDisplay();
    } catch (error) {
      console.error('Failed to save grid configuration:', error);
    }
  }

  /**
   * 更新网格显示
   */
  updateGridDisplay() {
    if (this.hexagonGridLayer) {
      // 首先隐藏所有网格
      this.hexagonGridLayer.hideGrid();
      
      // 遍历所有网格配置
      this.grids.forEach(grid => {
        if (grid.enabled) {
          // 先设置合并配置，这样在显示网格时就能正确应用
          if (grid.mergeAreas && Array.isArray(grid.mergeAreas)) {
            this.hexagonGridLayer.mergeConfig = grid.mergeAreas;
          } else {
            this.hexagonGridLayer.mergeConfig = [];
          }
          
          // 更新网格参数
          this.hexagonGridLayer.setGridOptions({
            radius: grid.gridRadius,
            areaRadius: grid.areaRadius,
            center: [grid.latitude, grid.longitude]
          });
          
          // 显示启用的网格
          this.hexagonGridLayer.showGrid();
        }
      });
    }
  }
  
  /**
   * 创建新的网格配置
   */
  createNewGrid() {
    // 如果有地图和六边形网格图层，使用当前地图中心作为默认值
    let centerLat = 39.9042;
    let centerLng = 116.4074;
    
    if (this.hexagonGridLayer && this.hexagonGridLayer.map) {
      const mapCenter = this.hexagonGridLayer.map.getCenter();
      centerLat = mapCenter.lat;
      centerLng = mapCenter.lng;
    }
    
    const newGrid = {
      name: `Grid ${this.grids.length + 1}`,
      latitude: centerLat,
      longitude: centerLng,
      areaRadius: 5000,
      gridRadius: 500,
      mergeAreas: [],
      enabled: true
    };
    
    // 将新网格添加到数组开头
    this.grids.unshift(newGrid);
    this.saveGridsToLocalStorage();
    
    // 重新渲染网格列表，并标记新网格的索引
    this.renderGrids(0);
    
    // 应用新创建的网格
    this.applyGrid(0);
  }
  
  /**
   * 删除网格配置
   * @param {number} index - 网格索引
   */
  deleteGrid(index) {
    if (index >= 0 && index < this.grids.length) {
      if (confirm('Delete this grid configuration?')) {
        // 如果当前正在显示该网格，先隐藏它
        if (this.hexagonGridLayer && this.hexagonGridLayer.visible) {
          this.hexagonGridLayer.hideGrid();
        }
        
        this.grids.splice(index, 1);
        this.saveGridsToLocalStorage();
        
        // 重新渲染网格列表
        this.renderGrids();
        
        console.log(`Grid configuration deleted, ${this.grids.length} grids remaining`);
      }
    }
  }
  
  /**
   * 应用网格配置到地图
   * @param {number} index - 网格索引
   */
  applyGrid(index) {
    if (index >= 0 && index < this.grids.length) {
      const grid = this.grids[index];
      
      // 应用网格配置到地图
      if (this.hexagonGridLayer) {
        // 隐藏当前网格（如果有）
        if (this.hexagonGridLayer.visible) {
          this.hexagonGridLayer.hideGrid();
        }
        
        // 设置新的网格参数
        this.hexagonGridLayer.setGridOptions({
          center: [grid.latitude, grid.longitude],
          radius: grid.gridRadius,
          areaRadius: grid.areaRadius
        });
        
        // 如果有合并区域配置，设置合并配置
        if (grid.mergeAreas && grid.mergeAreas.length > 0) {
          this.hexagonGridLayer.mergeConfig = grid.mergeAreas;
        } else {
          this.hexagonGridLayer.mergeConfig = [];
        }
        
        // 显示网格
        this.hexagonGridLayer.showGrid();
        
        console.log(`Grid configuration applied: ${grid.name}`);
      }
    }
  }
  

  
  /**
   * 渲染单个网格卡片
   * @param {Object} grid - 网格配置对象
   * @param {number} index - 网格索引
   */
  renderGridCard(grid, index) {
    // 检查是否已存在卡片，如果存在则更新内容
    let card = document.querySelector(`.grid-card[data-index="${index}"]`);
    
    if (!card) {
      // 创建新卡片
      card = document.createElement('div');
      card.className = 'grid-card';
      card.dataset.index = index;
      this.gridsContainer.appendChild(card);
    }
    
    // 判断是否处于编辑模式
    const isEditMode = card.classList.contains('edit-mode');
    
    if (isEditMode) {
      // 编辑模式 - 显示JSON编辑器
      card.innerHTML = `
        <div class="grid-card-header">
          <h3>${grid.name}</h3>
          <button class="grid-card-delete" title="Delete Grid"><i class="fas fa-trash"></i></button>
        </div>
        <div class="grid-card-content">
          <textarea class="grid-json-editor">${JSON.stringify(grid, null, 2)}</textarea>
          <div class="grid-card-actions">
            <button class="grid-btn grid-card-edit" title="Complete Edit"><i class="fas fa-check"></i> Complete</button>
            <button class="grid-btn grid-card-apply" title="Apply to Map"><i class="fas fa-map-marker-alt"></i> Apply</button>
          </div>
        </div>
      `;
    } else {
      // 展示模式 - 显示格式化的字段
      const mergeAreasDisplay = grid.mergeAreas && grid.mergeAreas.length > 0 
        ? `<div class="grid-field"><span>Continuous Areas:</span> ${grid.mergeAreas.length} areas</div>`
        : `<div class="grid-field"><span>Continuous Areas:</span> None</div>`;
        
      card.innerHTML = `
        <div class="grid-card-header">
          <h3>${grid.name}</h3>
          <button class="grid-card-delete" title="Delete Grid"><i class="fas fa-trash"></i></button>
        </div>
        <div class="grid-card-content">
          <div class="grid-field"><span>Latitude:</span> ${grid.latitude}</div>
          <div class="grid-field"><span>Longitude:</span> ${grid.longitude}</div>
          <div class="grid-field"><span>Area Radius:</span> ${grid.areaRadius}m</div>
          <div class="grid-field"><span>Grid Radius:</span> ${grid.gridRadius}m</div>
          ${mergeAreasDisplay}
          <div class="grid-card-actions">
            <button class="grid-btn grid-card-edit" title="Edit Grid"><i class="fas fa-edit"></i> Edit</button>
            <button class="grid-btn grid-card-apply" title="Apply to Map"><i class="fas fa-map-marker-alt"></i> Apply</button>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * 打开网格管理器
   */
  openGridManager() {
    const modal = document.getElementById('manageGridsModal');
    if (modal) {
      modal.style.display = 'block';
      this.renderGrids();
    }
  }
  
  /**
   * 关闭网格管理器
   */
  closeGridManager() {
    const modal = document.getElementById('manageGridsModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  /**
   * 设置ESC键关闭网格管理器
   * @private
   */
  _setupEscKeyListener() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('manageGridsModal');
        if (modal && (modal.style.display === 'flex' || modal.style.display === 'block')) {
          this.closeGridManager();
        }
      }
    });
  }
  
  /**
   * 渲染网格列表
   */
  renderGrids(newGridIndex = -1) {
    const container = document.getElementById('gridsContainer');
    if (!container) return;
    
    // 完全清空容器，确保没有残留内容
    container.innerHTML = '';
    
    // 检查是否有网格配置
    if (this.grids.length === 0) {
      // 显示空状态
      container.innerHTML = `
        <div class="empty-state">
          <p>You have no saved grid configurations</p>
          <button id="addFirstGrid" class="save">Add first grid</button>
        </div>
      `;

      // 添加第一个网格按钮点击事件
      document.getElementById('addFirstGrid').addEventListener('click', () => {
        this.createNewGrid();
      });

      return;
    }
    
    // 导入JSON5支持模块
    import('../editor/json5-support.js').then(({ createJSON5Editor }) => {
      // 确保容器是空的，防止重复渲染
      if (container.children.length > 0) {
        container.innerHTML = '';
      }
      
      this.grids.forEach((grid, index) => {
        // 创建简化的卡片结构
        const card = document.createElement('div');
        card.className = 'grid-card' + (index === newGridIndex ? ' new' : '');
        card.dataset.index = index;
        
        // 创建按钮区域
        const buttons = document.createElement('div');
        buttons.className = 'grid-card-buttons';
        buttons.innerHTML = `
          <div class="switch-group">
            <span class="label-text">display</span>
            <input type="checkbox" class="grid-switch" id="grid-switch-${index}" ${grid.enabled ? 'checked' : ''}>
          </div>
          <div class="action-group">
            <button class="edit-btn" title="Edit Grid"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" title="Delete Grid"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;
        
        // 绑定事件
        const gridSwitch = buttons.querySelector('.grid-switch');
        const labelText = buttons.querySelector('.label-text');

        // 为label文本添加点击事件，模拟label功能
        labelText.addEventListener('click', () => {
          gridSwitch.click();
        });

        gridSwitch.addEventListener('change', () => {
          const isEnabled = gridSwitch.checked;
          this.grids[index].enabled = isEnabled;
          this.saveGridsToLocalStorage();

          if (isEnabled) {
            this.applyGrid(index);
          } else if (this.hexagonGridLayer) {
            this.hexagonGridLayer.hideGrid();
          }
        });
        
        // 创建编辑器容器
        const editorContainer = document.createElement('div');
        editorContainer.className = 'json-editor-container grid-card-content';
        // editorContainer.style.width = '100%';
        editorContainer.style.minHeight = '150px';
        editorContainer.style.overflow = 'visible';
        editorContainer.style.position = 'relative';
        editorContainer.style.flex = '1';
        
        // 添加到卡片
        card.appendChild(buttons); // 按钮现在是绝对定位的，会浮动在右上角
        card.appendChild(editorContainer);
        container.appendChild(card);
        
        // 添加双击事件监听器
        card.addEventListener('dblclick', () => {
          // 触发编辑按钮点击
          editBtn.click();
        });
        
        // 绑定按钮事件
        const editBtn = buttons.querySelector('.edit-btn');
        const deleteBtn = buttons.querySelector('.delete-btn');
        
        gridSwitch.addEventListener('change', () => {
          const isEnabled = gridSwitch.checked;
          this.grids[index].enabled = isEnabled;
          this.saveGridsToLocalStorage();
          
          if (isEnabled) {
            this.applyGrid(index);
          } else if (this.hexagonGridLayer && this.hexagonGridLayer.visible) {
            this.hexagonGridLayer.hideGrid();
          }
        });
        
        // 初始化编辑器
        window.monacoHelpers.waitForMonaco().then(() => {
          // 创建 JSON5 编辑器
          const json5Editor = createJSON5Editor(editorContainer, {
            value: JSON.stringify(grid, null, 2),
            readOnly: true,
            fontSize: 12,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false
          });
          
          // 绑定编辑按钮事件
          editBtn.addEventListener('click', () => {
            // 切换编辑状态
            const isEditing = editBtn.classList.contains('editing');
            const cardContent = editorContainer.closest('.grid-card-content');
            if (isEditing) {
              // 保存编辑
              try {
                const updatedGrid = JSON.parse(json5Editor.getValue());
                this.grids[index] = updatedGrid;
                this.saveGridsToLocalStorage();
                editBtn.classList.remove('editing');
                cardContent?.classList.remove('editing');
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = 'Edit Grid';
                json5Editor.editor?.updateOptions?.({ readOnly: true });
              } catch (error) {
                console.error('Failed to parse JSON:', error);
              }
            } else {
              // Enter edit mode
              editBtn.classList.add('editing');
              cardContent?.classList.add('editing');
              editBtn.innerHTML = '<i class="fas fa-save"></i>';
              editBtn.title = 'Save Grid';
              json5Editor.editor?.updateOptions?.({ readOnly: false });
            }
          });
        }).catch(error => {
          console.error('Monaco editor failed to load:', error);
          
          // 如果 Monaco 加载失败，使用普通文本区域作为后备
          const textarea = document.createElement('textarea');
          textarea.className = 'json-editor';
          textarea.value = JSON.stringify(grid, null, 2);
          // textarea.style.width = '100%';
          textarea.style.minHeight = '150px';
          textarea.style.fontFamily = 'monospace';
          textarea.style.padding = '8px';
          textarea.style.boxSizing = 'border-box';
          textarea.readOnly = true;
          
          editorContainer.appendChild(textarea);
          
          // 绑定编辑按钮事件
          editBtn.addEventListener('click', () => {
            // 切换编辑状态
            const isEditing = editBtn.classList.contains('editing');
            const cardContent = editorContainer.closest('.grid-card-content');
            if (isEditing) {
              // 保存编辑
              try {
                const updatedGrid = JSON.parse(textarea.value);
                this.grids[index] = updatedGrid;
                this.saveGridsToLocalStorage();
                editBtn.classList.remove('editing');
                cardContent?.classList.remove('editing');
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = 'Edit Grid';
                textarea.readOnly = true;
              } catch (error) {
                console.error('Failed to parse JSON:', error);
              }
            } else {
              // 进入编辑模式
              editBtn.classList.add('editing');
              cardContent?.classList.add('editing');
              editBtn.innerHTML = '<i class="fas fa-save"></i>';
              editBtn.title = 'Save Grid';
              textarea.readOnly = false;
            }
          });
        });
        
        deleteBtn.addEventListener('click', () => this.deleteGrid(index));
      });
    }).catch(error => {
      console.error('Failed to load JSON5 support module:', error);
      // 如果加载失败，使用原始的渲染方式
      // 确保容器是空的，避免重复渲染
      container.innerHTML = '';
      this._renderGridsWithFallback(container);
    });
  }
  
  /**
   * 备用的网格渲染方法（当JSON5支持模块加载失败时使用）
   * @private
   */
  _renderGridsWithFallback(container) {
    this.grids.forEach((grid, index) => {
      // 创建简化的卡片结构
      const card = document.createElement('div');
      card.className = 'grid-card';
      card.dataset.index = index;
      
      // 创建按钮区域
      const buttons = document.createElement('div');
      buttons.className = 'grid-card-buttons';
      buttons.innerHTML = `
        <div class="switch-container">
          <label class="switch">
            <input type="checkbox" class="grid-switch" ${grid.enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <span class="switch-label">${grid.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <button class="edit-btn">edit</button>
        <button class="delete-btn">delete</button>
      `;
      

      
      // 创建编辑器容器
      const editorContainer = document.createElement('div');
      editorContainer.className = 'json-editor-container';
      // editorContainer.style.width = '100%';
      editorContainer.style.minHeight = '150px';
      editorContainer.style.overflow = 'visible';
      editorContainer.style.position = 'relative';
      editorContainer.style.flex = '1';
      
      // 创建文本区域
      const textarea = document.createElement('textarea');
      textarea.className = 'json-editor';
      textarea.value = JSON.stringify(grid, null, 2);
      // textarea.style.width = '100%';
      textarea.style.minHeight = '150px';
      textarea.style.fontFamily = 'monospace';
      textarea.style.padding = '8px';
      textarea.style.boxSizing = 'border-box';
      
      editorContainer.appendChild(textarea);
      
      // 添加到卡片
      card.appendChild(buttons); // 按钮现在是绝对定位的，会浮动在右上角
      card.appendChild(editorContainer);
      container.appendChild(card);
      
      // 添加双击事件监听器
      card.addEventListener('dblclick', () => {
        // 触发编辑按钮点击
        editBtn.click();
      });
      
      // 绑定按钮事件
      const gridSwitch = buttons.querySelector('.grid-switch');
      const switchLabel = buttons.querySelector('.switch-label');
      const editBtn = buttons.querySelector('.edit-btn');
      const deleteBtn = buttons.querySelector('.delete-btn');
      
      gridSwitch.addEventListener('change', () => {
        const isEnabled = gridSwitch.checked;
        this.grids[index].enabled = isEnabled;
        switchLabel.textContent = isEnabled ? 'Enable' : 'Disable';
        this.saveGridsToLocalStorage();
        
        // 立即更新网格显示
        this.updateGridDisplay();
      });
      
      editBtn.addEventListener('click', () => {
        // 切换编辑状态
        const isEditing = editBtn.classList.contains('editing');
        if (isEditing) {
          // 保存编辑
          try {
            const updatedGrid = JSON.parse(textarea.value);
            const previousGrid = this.grids[index];
            this.grids[index] = updatedGrid;
            
            // 检查是否有 mergeAreas 变化
            const mergeAreasChanged = JSON.stringify(previousGrid.mergeAreas) !== JSON.stringify(updatedGrid.mergeAreas);
            
            this.saveGridsToLocalStorage();
            
            // 如果 mergeAreas 有变化，强制重新加载网格
            if (mergeAreasChanged && this.hexagonGridLayer) {
              this.hexagonGridLayer.hideGrid();
              this.updateGridDisplay();
            }
            
            editBtn.classList.remove('editing');
            editBtn.textContent = 'edit';
            textarea.readOnly = true;
          } catch (error) {
            console.error('Failed to parse JSON:', error);
          }
        } else {
          // 进入编辑模式
          editBtn.classList.add('editing');
          editBtn.textContent = 'save';
          textarea.readOnly = false;
        }
      });
      
      deleteBtn.addEventListener('click', () => this.deleteGrid(index));
      
      // 默认设置为只读
      textarea.readOnly = true;
    });
  }
  /**
   * 导出网格配置
   */
  exportGrids() {
    if (this.grids.length === 0) {
      alert('No grid configurations available for export');
      return;
    }
    
    const jsonData = JSON.stringify(this.grids, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hexagon_grids.json';
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  /**
   * 导入网格配置
   */
  importGrids() {
    // 创建一个临时的文件输入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // 检查文件类型
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        alert('Please select a JSON file');
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          if (!Array.isArray(importedData)) {
            alert('Invalid imported data format');
            return;
          }
          
          // Validate each grid object format
          const validGrids = importedData.filter(grid => {
            return grid && 
                   typeof grid.name === 'string' && 
                   typeof grid.latitude === 'number' && 
                   typeof grid.longitude === 'number' &&
                   typeof grid.areaRadius === 'number' &&
                   typeof grid.gridRadius === 'number';
          });
          
          if (validGrids.length === 0) {
            alert('No valid grid configurations found in imported data');
            return;
          }
          
          // Confirm import
          if (confirm(`Import ${validGrids.length} grid configurations. Continue?`)) {
            // Merge grid configurations
            this.grids = [...validGrids, ...this.grids];
            this.saveGridsToLocalStorage();
            this.renderGrids();
            alert('Grid configurations imported successfully');
          }
        } catch (error) {
          console.error('Failed to parse JSON:', error);
          alert('Failed to parse file. Please ensure it is a valid JSON file');
        }
      };
      
      reader.onerror = () => {
        alert('Failed to read file');
      };
      
      reader.readAsText(file);
    });
    
    // 触发文件选择对话框
    input.click();
  }
}

export default GridController;
